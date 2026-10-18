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

/** 42710 tipo/objeto, 42P07 tabla/índice, 42701 columna, 42P06 esquema, 42723 función. */
const OBJETO_DUPLICADO_RE = /\b(42710|42P07|42701|42P06|42723)\b|already exists|ya existe/i;

/**
 * P3018 porque los objetos de la migración ya existen: el esquema la tiene aplicada
 * pero `_prisma_migrations` no (historial desincronizado). Devuelve el nombre o null.
 */
function migracionYaPresenteEnEsquema(output) {
  const text = String(output);
  if (!/P3018/.test(text) || !OBJETO_DUPLICADO_RE.test(text)) return null;
  const m = text.match(/Migration name:\s*(\S+)/);
  return m ? m[1] : null;
}

function isMissingMigrationsTableError(err) {
  const msg = `${err?.message ?? ''} ${err?.meta?.message ?? ''} ${err?.code ?? ''}`;
  return (
    /42P01/i.test(msg) ||
    /_prisma_migrations["']?\s+does not exist/i.test(msg) ||
    /no existe la relaci/i.test(msg)
  );
}

async function prismaMigrationsTableExists(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT 1::int AS ok
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = '_prisma_migrations'
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
}

/** Esquema estándar de Prisma 5 si hace falta baseline sin la tabla. */
async function ensurePrismaMigrationsTable(prisma) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
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
    if (!(await prismaMigrationsTableExists(prisma))) {
      console.log('Sin tabla _prisma_migrations aún; se omite reparación.');
      return;
    }

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
  } catch (err) {
    if (isMissingMigrationsTableError(err)) {
      console.log('Sin tabla _prisma_migrations; se omite reparación.');
      return;
    }
    throw err;
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
    await ensurePrismaMigrationsTable(prisma);
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

async function marcarMigracionAplicada(name) {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = ${name}
        AND (finished_at IS NULL OR rolled_back_at IS NOT NULL)
    `;
    const id = crypto.randomUUID().replace(/-/g, '');
    const checksum = migrationChecksum(name);
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      SELECT ${id}, ${checksum}, NOW(), ${name}, 'resuelta: objetos ya existían en la BD', NULL, NOW(), 1
      WHERE NOT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE migration_name = ${name}
          AND finished_at IS NOT NULL
          AND rolled_back_at IS NULL
      )
    `;
  } finally {
    await prisma.$disconnect();
  }
}

/** Solo informa: diferencias entre la BD y schema.prisma tras resolver historial. */
function reportarDiferenciasEsquema() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  try {
    runPrisma([
      'migrate',
      'diff',
      '--from-url',
      url,
      '--to-schema-datamodel',
      path.join(apiRoot, 'prisma', 'schema.prisma'),
      '--exit-code',
    ]);
    console.log('Esquema verificado: la BD coincide con schema.prisma.');
  } catch (err) {
    if (err.status === 2) {
      const detalle = String(err.stdout ?? '').split('\n').slice(0, 30).join('\n');
      console.warn('AVISO: la BD difiere de schema.prisma tras resolver el historial:');
      console.warn(detalle);
    } else {
      console.warn(`No se pudo verificar el esquema: ${err.message ?? err}`);
    }
  }
}

function bootstrapFreshDatabase() {
  console.log('');
  console.log('Base vacía o sin esquema base: creando desde schema.prisma (db push)...');
  runPrisma(['db', 'push', '--accept-data-loss'], { inherit: true });
  return markAllMigrationsApplied();
}

/** Solo BD sin tablas de app. Nunca destruir datos de un restaurante ya en marcha. */
async function bootstrapFreshDatabaseSafe() {
  const tables = await countAppTables();
  if (tables > 0) {
    throw new Error(
      `RECHAZADO: se intentó recrear la BD con ${tables} tabla(s) existente(s). ` +
        'Eso borraría restaurante, impresoras y tickets. Revisa migraciones (P3009) sin db push --accept-data-loss.',
    );
  }
  return bootstrapFreshDatabase();
}

const MAX_MIGRACIONES_RESUELTAS = 30;

async function tryMigrateDeploy() {
  await repairMigrationHistory();
  const resueltas = [];
  try {
    for (;;) {
      try {
        const output = runPrisma(['migrate', 'deploy']);
        process.stdout.write(output || '');
        break;
      } catch (error) {
        const output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`;
        const nombre = migracionYaPresenteEnEsquema(output);
        if (!nombre || resueltas.includes(nombre) || resueltas.length >= MAX_MIGRACIONES_RESUELTAS) {
          throw error;
        }
        console.log(
          `Migración ${nombre}: sus objetos ya existen en la BD; se marca como aplicada en el historial.`,
        );
        await marcarMigracionAplicada(nombre);
        resueltas.push(nombre);
      }
    }
    if (resueltas.length > 0) {
      console.log(`Historial Prisma sincronizado (${resueltas.length} migración(es) ya presentes).`);
      reportarDiferenciasEsquema();
    }
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

    if (/P3009|failed migrations/i.test(output)) {
      console.log('');
      console.log(
        'Migración fallida (P3009): se repara historial y se reintenta deploy. ' +
          'NO se usa db push --accept-data-loss (protege datos del restaurante).',
      );
      await repairMigrationHistory();
      try {
        const retry = runPrisma(['migrate', 'deploy']);
        process.stdout.write(retry || '');
        return;
      } catch (retryErr) {
        const retryOut = `${retryErr.stdout ?? ''}${retryErr.stderr ?? ''}${retryErr.message ?? ''}`;
        process.stdout.write(retryOut);
        console.error(
          'No se pudo aplicar migraciones sin destruir datos. ' +
            'Revisa api\\logs y data\\backups; no se reinicia la base vacía.',
        );
        throw retryErr;
      }
    }

    // Antes: "does not exist" disparaba bootstrapFresh y podía borrar un local con datos.
    throw error;
  }
}

async function main() {
  const tables = await countAppTables();
  if (tables === 0) {
    console.log('Base sin tablas de aplicación: bootstrap inicial...');
    await bootstrapFreshDatabaseSafe();
    return;
  }

  await tryMigrateDeploy();
  await ensureImpresoraMacEsperada();
}

async function ensureImpresoraMacEsperada() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "impresora_pos" ADD COLUMN IF NOT EXISTS "mac_esperada" VARCHAR(17)`,
    );
  } catch (err) {
    if (isMissingMigrationsTableError(err)) return;
    const msg = `${err?.message ?? ''} ${err?.code ?? ''}`;
    if (/42P01|impresora_pos/i.test(msg) && /does not exist|no existe/i.test(msg)) {
      return;
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
