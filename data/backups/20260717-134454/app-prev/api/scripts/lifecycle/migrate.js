/**
 * Punto único de migraciones del Lifecycle Host.
 * Delega a preparar-base-datos.js y registra auditoría en lifecycle_migration_run.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiRoot = process.cwd();
const preparar = path.join(apiRoot, 'scripts', 'preparar-base-datos.js');
const migrationsDir = path.join(apiRoot, 'prisma', 'migrations');

function listMigrationNames() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();
}

function readVersions() {
  const candidates = [
    path.join(apiRoot, '..', 'VERSION.json'),
    path.join(apiRoot, '..', 'data', 'versions.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      /* ignore */
    }
  }
  return {};
}

async function audit(prisma, { nombre, estado, duracionMs, resultado, error }) {
  const versions = readVersions();
  const schemaVersion =
    typeof versions.schemaVersion === 'number'
      ? versions.schemaVersion
      : listMigrationNames().length;
  const versionApp = versions.appVersion || versions.version || null;
  try {
    await prisma.$executeRaw`
      INSERT INTO lifecycle_migration_run
        (nombre, version_app, schema_version, duracion_ms, estado, usuario, resultado, error)
      VALUES
        (${nombre}, ${versionApp}, ${schemaVersion}, ${duracionMs}, ${estado}, ${'launcher'}, ${resultado}, ${error})
    `;
  } catch (e) {
    console.warn('[lifecycle/migrate] auditoría omitida:', e.message || e);
  }
}

async function main() {
  if (!fs.existsSync(preparar)) {
    console.error(`No existe ${preparar}`);
    process.exit(1);
  }

  const started = Date.now();
  const names = listMigrationNames();
  const last = names[names.length - 1] || 'none';

  const result = spawnSync(process.execPath, ['--env-file=.env', preparar], {
    cwd: apiRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output);
  const duracionMs = Date.now() - started;
  const ok = result.status === 0;

  let PrismaClient;
  try {
    ({ PrismaClient } = require('@prisma/client'));
  } catch {
    if (!ok) process.exit(result.status || 1);
    return;
  }

  const prisma = new PrismaClient();
  try {
    await audit(prisma, {
      nombre: last,
      estado: ok ? 'ok' : 'failed',
      duracionMs,
      resultado: ok ? `migrate ok (${names.length} migraciones en paquete)` : null,
      error: ok ? null : output.slice(-4000),
    });
  } finally {
    await prisma.$disconnect();
  }

  if (!ok) process.exit(result.status || 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
