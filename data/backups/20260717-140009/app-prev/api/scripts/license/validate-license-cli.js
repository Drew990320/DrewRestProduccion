/**
 * CLI para el launcher: valida license.key (firma, machineId, vencimiento).
 * Exit 0 = OK o skip; 78 = inválida; 1 = error.
 * Uso: node validate-license-cli.js [--json]
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAx7eTrNSFKY6ASlo2Go1OUf+4YG3Qfx2KJUe0RU8K+sw=
-----END PUBLIC KEY-----
`;

function validate() {
  const skip =
    process.env.LICENSE_SKIP === 'true' || process.env.LICENSE_SKIP === '1';
  if (skip) {
    return { ok: true, skipped: true, message: 'LICENSE_SKIP activo' };
  }

  const enforce =
    process.env.LICENSE_ENFORCE === 'true' ||
    process.env.LICENSE_ENFORCE === '1' ||
    process.env.NODE_ENV === 'production';

  const licensePath =
    process.env.LICENSE_FILE || path.join(process.cwd(), 'license.key');

  let machineId = process.env.DREWREST_MACHINE_ID || '';
  if (!machineId) {
    try {
      machineId = require('./machine-id').getMachineId();
    } catch {
      machineId = '';
    }
  }

  if (!fs.existsSync(licensePath)) {
    if (!enforce) {
      return { ok: true, skipped: true, message: 'Sin license.key (no enforce)' };
    }
    return { ok: false, code: 78, message: 'No se encontró license.key' };
  }

  let license;
  try {
    license = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
  } catch (e) {
    return { ok: false, code: 78, message: `No se pudo leer licencia: ${e.message}` };
  }

  if (!license?.payload || typeof license.signature !== 'string') {
    return { ok: false, code: 78, message: 'Formato de licencia inválido' };
  }

  const p = license.payload;
  const canonical = JSON.stringify({
    v: p.v,
    machineId: p.machineId,
    cliente: p.cliente,
    issuedAt: p.issuedAt,
    expiresAt: p.expiresAt,
  });

  try {
    const key = crypto.createPublicKey(PUBLIC_KEY_PEM);
    const ok = crypto.verify(
      null,
      Buffer.from(canonical, 'utf8'),
      key,
      Buffer.from(license.signature, 'base64'),
    );
    if (!ok) {
      return { ok: false, code: 78, message: 'Firma de licencia inválida' };
    }
  } catch (e) {
    return { ok: false, code: 78, message: `Error verificando firma: ${e.message}` };
  }

  if (machineId && p.machineId && p.machineId.toLowerCase() !== machineId.toLowerCase()) {
    return {
      ok: false,
      code: 78,
      message: 'Esta licencia pertenece a otro PC',
      machineId,
    };
  }

  if (p.expiresAt) {
    const end = Date.parse(p.expiresAt);
    if (Number.isNaN(end) || Date.now() > end) {
      return {
        ok: false,
        code: 78,
        message: `Licencia vencida (${p.expiresAt})`,
      };
    }
  }

  let daysLeft = null;
  if (p.expiresAt) {
    const end = Date.parse(p.expiresAt);
    if (!Number.isNaN(end)) {
      daysLeft = Math.ceil((end - Date.now()) / 86_400_000);
    }
  }

  return {
    ok: true,
    skipped: false,
    cliente: p.cliente,
    expiresAt: p.expiresAt,
    daysLeft,
    machineId: p.machineId,
  };
}

function main() {
  const asJson = process.argv.includes('--json');
  const result = validate();

  if (asJson) {
    process.stdout.write(JSON.stringify(result) + '\n');
  } else if (result.ok) {
    console.log(
      result.skipped
        ? `[licencia] omitida: ${result.message || 'skip'}`
        : `[licencia] OK — ${result.cliente || 'activa'}`,
    );
  } else {
    console.error(`[licencia] ${result.message}`);
  }

  if (!result.ok) process.exit(result.code || 78);
  process.exit(0);
}

main();
