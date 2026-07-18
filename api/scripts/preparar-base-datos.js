/**
 * Prepara la BD on-prem: migrate deploy en BD existente, o db push + baseline en BD vacía.
 * Evita bucles de `npx prisma migrate resolve` (cuelgan el launcher varios minutos en Windows).
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');
const migrationsDir = path.join(apiRoot, 'prisma', 'migrations');
const prismaCli = path.join(apiRoot, 'node_modules', 'prisma', 'build', 'index.js');

function runPrisma(args, { inherit = false } = {}) {
  if (!fs.existsSync(prismaCli)) {
    throw new Error(`No existe Prisma CLI embebido: ${prismaCli}`);
  }
  console.log(`> prisma ${args.join(' ')}`);
  return execFileSync(process.execPath, [prismaCli, ...args], {
    cwd: apiRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
}

function listMigrationNames() {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`No existe ${migrationsDir}`);
  }
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();
}

function migrationChecksum(name) {
  const file = path.join(migrationsDir, name, 'migration.sql');
  const content = fs.readFileSync(file);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function failedMigrationNames(output) {
  const names = new Set();
  for (const match of String(output).matchAll(/`([^`]+)` migration/g)) {
    names.add(match[1]);
  }
  return [...names];
}

async function countAppTables() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw`
      SELECT count(*)::int AS n
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
    `;
    return Number(rows[0]?.n ?? 0);
  } finally {
    await prisma.$disconnect();
  }
}

/** Quita filas rotas / duplicadas que hacen colgar `migrate deploy` / `resolve`. */
async function repairMigrationHistory() {
  const prisma = new PrismaClient();
  try {
    const deletedBroken = await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations"
      WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
    `);
    const deletedDupes = await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" a
      USING "_prisma_migrations" b
      WHERE a.migration_name = b.migration_name
        AND a.ctid < b.ctid
    `);
    if (deletedBroken || deletedDupes) {
      console.log(
        `Historial Prisma reparado (rotas=${deletedBroken}, duplicadas=${deletedDupes}).`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

/** Baseline en un solo paso SQL (sin 70+ procesos npx). */
async function markAllMigrationsApplied() {
  const names = listMigrationNames();
  console.log('');
  console.log(`Marcando ${names.length} migraciones como aplicadas (SQL)…`);
  const prisma = new PrismaClient();
  try {
    let inserted = 0;
    for (const name of names) {
      const id = crypto.randomUUID().replace(/-/g, '');
      const checksum = migrationChecksum(name);
      const n = await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations"
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        SELECT ${id}, ${checksum}, NOW(), ${name}, NULL, NULL, NOW(), 1
        WHERE NOT EXISTS (
          SELECT 1 FROM "_prisma_migrations"
          WHERE migration_name = ${name}
            AND finished_at IS NOT NULL
            AND rolled_back_at IS NULL
        )
      `;
      if (Number(n) > 0) inserted += 1;
    }
    console.log(`  Baseline: ${inserted} nuevas, ${names.length - inserted} ya estaban.`);
  } finally {
    await prisma.$disconnect();
  }
}

function bootstrapFreshDatabase() {
  console.log('');
  console.log('Base vacía o sin esquema base: creando desde schema.prisma (db push)...');
  runPrisma(['db', 'push', '--accept-data-loss'], { inherit: true });
  return markAllMigrationsApplied();
}

async function tryMigrateDeploy() {
  await repairMigrationHistory();
  try {
    const output = runPrisma(['migrate', 'deploy']);
    process.stdout.write(output || '');
    return;
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`;
    process.stdout.write(output);

    for (const name of failedMigrationNames(output)) {
      console.log(`Marcando migración fallida como revertida: ${name}`);
      try {
        runPrisma(['migrate', 'resolve', '--rolled-back', name]);
      } catch {
        /* ignore */
      }
    }

    if (/P3005|baseline|not empty|no está vacía|no esta vacia/i.test(output)) {
      console.log('');
      console.log('Base con tablas pero sin historial Prisma: baseline automatico...');
      await markAllMigrationsApplied();
      runPrisma(['migrate', 'deploy'], { inherit: true });
      return;
    }

    if (/P3009|failed migrations|does not exist|no existe la relaci/i.test(output)) {
      await bootstrapFreshDatabase();
      runPrisma(['migrate', 'deploy'], { inherit: true });
      return;
    }

    throw error;
  }
}

async function main() {
  const tables = await countAppTables();
  if (tables === 0) {
    console.log('Base sin tablas de aplicación: bootstrap inicial...');
    await bootstrapFreshDatabase();
    return;
  }

  await tryMigrateDeploy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
