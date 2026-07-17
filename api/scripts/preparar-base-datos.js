/**
 * Prepara la BD on-prem: migrate deploy en BD existente, o db push + baseline en BD vacía.
 * La primera migración del historial asume tablas base (creadas antes con db push).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8', env: process.env });
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

function failedMigrationNames(output) {
  const names = new Set();
  for (const match of output.matchAll(/`([^`]+)` migration/g)) {
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

function markAllMigrationsApplied() {
  console.log('');
  console.log('Marcando migraciones del paquete como ya aplicadas...');
  for (const name of listMigrationNames()) {
    try {
      runCapture(`npx prisma migrate resolve --applied "${name}"`);
      console.log(`  ok ${name}`);
    } catch {
      console.log(`  (omitida) ${name}`);
    }
  }
}

function bootstrapFreshDatabase() {
  console.log('');
  console.log('Base vacía o sin esquema base: creando desde schema.prisma (db push)...');
  run('npx prisma db push --accept-data-loss');
  markAllMigrationsApplied();
}

function tryMigrateDeploy() {
  try {
    const output = runCapture('npx prisma migrate deploy');
    process.stdout.write(output);
    return;
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`;
    process.stdout.write(output);

    for (const name of failedMigrationNames(output)) {
      console.log(`Marcando migración fallida como revertida: ${name}`);
      try {
        runCapture(`npx prisma migrate resolve --rolled-back "${name}"`);
      } catch {
        /* ignore */
      }
    }

    if (/P3005|baseline|not empty|no está vacía|no esta vacia/i.test(output)) {
      console.log('');
      console.log('Base con tablas pero sin historial Prisma: baseline automatico...');
      markAllMigrationsApplied();
      run('npx prisma migrate deploy');
      return;
    }

    if (/P3009|failed migrations|does not exist|no existe la relaci/i.test(output)) {
      bootstrapFreshDatabase();
      run('npx prisma migrate deploy');
      return;
    }

    throw error;
  }
}

async function main() {
  const tables = await countAppTables();
  if (tables === 0) {
    console.log('Base sin tablas de aplicación: bootstrap inicial...');
    bootstrapFreshDatabase();
    return;
  }

  tryMigrateDeploy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
