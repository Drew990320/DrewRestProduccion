/**
 * Huella de hardware del PC (misma lógica que src/license/machine-id.ts).
 * Mantener ambos archivos alineados.
 */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { dirname, join } = require('path');
const os = require('os');

const PLACEHOLDER_HW = new Set([
  '',
  'TO BE FILLED BY O.E.M.',
  'DEFAULT STRING',
  'NONE',
  'N/A',
  'NA',
  'NULL',
  'SYSTEM SERIAL NUMBER',
  'SYSTEM SERIAL NUMBER.',
  '0',
]);

const PLACEHOLDER_UUID = new Set([
  'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
  '00000000-0000-0000-0000-000000000000',
]);

function normalizeHw(value) {
  const v = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!v || PLACEHOLDER_HW.has(v) || PLACEHOLDER_UUID.has(v)) return '';
  return v;
}

function parseCimMap(out) {
  const map = {};
  for (const line of String(out).split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0) continue;
    map[line.slice(0, i).trim()] = line.slice(i + 1);
  }
  return map;
}

function hashMachineParts(parts) {
  const usable = parts.filter(Boolean);
  const material = usable.length > 0 ? usable.join('|') : `fallback|${os.hostname()}`;
  return createHash('sha256').update(material, 'utf8').digest('hex');
}

function parseMachineIdCache(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.machineId === 'string' &&
      /^[a-f0-9]{64}$/i.test(parsed.machineId) &&
      typeof parsed.machineGuid === 'string' &&
      parsed.machineGuid.trim() !== ''
    ) {
      return {
        machineId: parsed.machineId.toLowerCase(),
        machineGuid: parsed.machineGuid.trim().toUpperCase(),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function cacheAppliesToThisPc(cache, liveGuid) {
  if (!cache || !liveGuid) return false;
  return cache.machineGuid === String(liveGuid).trim().toUpperCase();
}

function sleepMs(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    /* ignore */
  }
}

function runHidden(file, args, timeoutMs) {
  try {
    return execFileSync(file, args, {
      encoding: 'utf8',
      windowsHide: true,
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

function readMachineGuidFromRegistry() {
  const out = runHidden(
    'reg.exe',
    ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
    8000,
  );
  const m = String(out).match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/i);
  return normalizeHw(m && m[1]);
}

function collectWindowsPartsOnce() {
  const guidFromReg = readMachineGuidFromRegistry();
  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$g = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid",
    "$u = (Get-CimInstance Win32_ComputerSystemProduct).UUID",
    "$b = (Get-CimInstance Win32_BaseBoard).SerialNumber",
    "$s = (Get-CimInstance Win32_BIOS).SerialNumber",
    "Write-Output ('GUID=' + $g)",
    "Write-Output ('UUID=' + $u)",
    "Write-Output ('BOARD=' + $b)",
    "Write-Output ('BIOS=' + $s)",
  ].join('; ');

  const out = runHidden(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    8000,
  );
  const map = parseCimMap(out);
  const guid = normalizeHw(map.GUID) || guidFromReg;
  const parts = [
    guid,
    normalizeHw(map.UUID),
    normalizeHw(map.BOARD),
    normalizeHw(map.BIOS),
  ].filter(Boolean);
  return { guid, parts };
}

function collectWindowsParts() {
  let best = { guid: '', parts: [] };
  for (let i = 0; i < 2; i++) {
    const cur = collectWindowsPartsOnce();
    if (cur.parts.length > best.parts.length) best = cur;
    if (cur.guid && cur.parts.length >= 2) return cur;
    if (i < 1) sleepMs(400);
  }
  if (!best.guid) {
    const guid = readMachineGuidFromRegistry();
    if (guid) return { guid, parts: [guid] };
  }
  return best;
}

function collectFallbackParts() {
  return [
    normalizeHw(os.hostname()),
    normalizeHw(os.userInfo().username),
    normalizeHw(os.arch()),
    normalizeHw(os.platform()),
  ].filter(Boolean);
}

function machineIdCachePaths(cwd) {
  const root = cwd || process.cwd();
  const env = process.env.DREWREST_MACHINE_ID_CACHE
    ? String(process.env.DREWREST_MACHINE_ID_CACHE).trim()
    : '';
  return [env, join(root, '..', 'data', 'machine-id'), join(root, 'machine-id.cache')].filter(
    Boolean,
  );
}

function readCache(cwd) {
  for (const p of machineIdCachePaths(cwd)) {
    if (!existsSync(p)) continue;
    try {
      const parsed = parseMachineIdCache(readFileSync(p, 'utf8'));
      if (parsed) return parsed;
    } catch {
      /* next */
    }
  }
  return null;
}

function persistMachineIdCache(machineId, machineGuid, cwd) {
  const payload = JSON.stringify({
    machineId: String(machineId).toLowerCase(),
    machineGuid: String(machineGuid).trim().toUpperCase(),
  });
  for (const p of machineIdCachePaths(cwd)) {
    try {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, payload, 'utf8');
      return;
    } catch {
      /* try next */
    }
  }
}

function computeLive() {
  if (process.platform === 'win32') {
    const { guid, parts } = collectWindowsParts();
    return { id: hashMachineParts(parts), guid };
  }
  return { id: hashMachineParts(collectFallbackParts()), guid: '' };
}

function getMachineId() {
  const guid = process.platform === 'win32' ? readMachineGuidFromRegistry() : '';
  const cache = readCache();
  if (cacheAppliesToThisPc(cache, guid)) {
    return cache.machineId;
  }
  const live = computeLive();
  if (cacheAppliesToThisPc(cache, live.guid)) {
    return cache.machineId;
  }
  if (live.guid) persistMachineIdCache(live.id, live.guid);
  return live.id;
}

function machineIdMatchesLicense(expected) {
  const want = String(expected ?? '')
    .trim()
    .toLowerCase();
  if (!want) return false;

  const guid = process.platform === 'win32' ? readMachineGuidFromRegistry() : '';
  const cache = readCache();
  if (cacheAppliesToThisPc(cache, guid) && cache.machineId === want) {
    return true;
  }

  const live = computeLive();
  if (live.id.toLowerCase() === want) {
    if (live.guid) persistMachineIdCache(want, live.guid);
    return true;
  }

  if (cacheAppliesToThisPc(cache, live.guid) && cache.machineId === want) {
    return true;
  }

  sleepMs(500);
  const again = computeLive();
  if (again.id.toLowerCase() === want) {
    if (again.guid) persistMachineIdCache(want, again.guid);
    return true;
  }
  if (cacheAppliesToThisPc(cache, again.guid) && cache.machineId === want) {
    return true;
  }

  return false;
}

function formatMachineIdDisplay(machineId) {
  const short = String(machineId).slice(0, 16).toUpperCase();
  return short.match(/.{1,4}/g)?.join('-') ?? short;
}

module.exports = {
  getMachineId,
  machineIdMatchesLicense,
  formatMachineIdDisplay,
  normalizeHw,
  parseMachineIdCache,
  cacheAppliesToThisPc,
};
