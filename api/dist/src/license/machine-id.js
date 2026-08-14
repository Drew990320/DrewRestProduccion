"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeHw = normalizeHw;
exports.parseCimMap = parseCimMap;
exports.hashMachineParts = hashMachineParts;
exports.parseMachineIdCache = parseMachineIdCache;
exports.cacheAppliesToThisPc = cacheAppliesToThisPc;
exports.machineIdCachePaths = machineIdCachePaths;
exports.persistMachineIdCache = persistMachineIdCache;
exports.getMachineId = getMachineId;
exports.machineIdMatchesLicense = machineIdMatchesLicense;
exports.formatMachineIdDisplay = formatMachineIdDisplay;
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const os = __importStar(require("os"));
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
    const v = (value ?? '').trim().toUpperCase();
    if (!v || PLACEHOLDER_HW.has(v) || PLACEHOLDER_UUID.has(v))
        return '';
    return v;
}
function parseCimMap(out) {
    const map = {};
    for (const line of out.split(/\r?\n/)) {
        const i = line.indexOf('=');
        if (i <= 0)
            continue;
        map[line.slice(0, i).trim()] = line.slice(i + 1);
    }
    return map;
}
function hashMachineParts(parts) {
    const material = parts.filter(Boolean).length > 0
        ? parts.filter(Boolean).join('|')
        : `fallback|${os.hostname()}`;
    return (0, crypto_1.createHash)('sha256').update(material, 'utf8').digest('hex');
}
function parseMachineIdCache(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.machineId === 'string' &&
            /^[a-f0-9]{64}$/i.test(parsed.machineId) &&
            typeof parsed.machineGuid === 'string' &&
            parsed.machineGuid.trim() !== '') {
            return {
                machineId: parsed.machineId.toLowerCase(),
                machineGuid: parsed.machineGuid.trim().toUpperCase(),
            };
        }
    }
    catch {
    }
    return null;
}
function cacheAppliesToThisPc(cache, liveGuid) {
    if (!cache || !liveGuid)
        return false;
    return cache.machineGuid === liveGuid.trim().toUpperCase();
}
function sleepMs(ms) {
    try {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    }
    catch {
    }
}
function runHidden(file, args, timeoutMs) {
    try {
        return (0, child_process_1.execFileSync)(file, args, {
            encoding: 'utf8',
            windowsHide: true,
            timeout: timeoutMs,
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    }
    catch {
        return '';
    }
}
function readMachineGuidFromRegistry() {
    const out = runHidden('reg.exe', [
        'query',
        'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
        '/v',
        'MachineGuid',
    ], 8_000);
    const m = out.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/i);
    return normalizeHw(m?.[1]);
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
    const out = runHidden('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], 8_000);
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
        if (cur.parts.length > best.parts.length)
            best = cur;
        if (cur.guid && cur.parts.length >= 2)
            return cur;
        if (i < 1)
            sleepMs(400);
    }
    if (!best.guid) {
        const guid = readMachineGuidFromRegistry();
        if (guid)
            return { guid, parts: [guid] };
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
function machineIdCachePaths(cwd = process.cwd()) {
    const env = process.env.DREWREST_MACHINE_ID_CACHE?.trim();
    return [
        env,
        (0, path_1.join)(cwd, '..', 'data', 'machine-id'),
        (0, path_1.join)(cwd, 'machine-id.cache'),
    ].filter((p) => Boolean(p));
}
function readCache(cwd = process.cwd()) {
    for (const p of machineIdCachePaths(cwd)) {
        if (!(0, fs_1.existsSync)(p))
            continue;
        try {
            const parsed = parseMachineIdCache((0, fs_1.readFileSync)(p, 'utf8'));
            if (parsed)
                return parsed;
        }
        catch {
        }
    }
    return null;
}
function persistMachineIdCache(machineId, machineGuid, cwd = process.cwd()) {
    const payload = JSON.stringify({
        machineId: machineId.toLowerCase(),
        machineGuid: machineGuid.trim().toUpperCase(),
    });
    for (const p of machineIdCachePaths(cwd)) {
        try {
            (0, fs_1.mkdirSync)((0, path_1.dirname)(p), { recursive: true });
            (0, fs_1.writeFileSync)(p, payload, 'utf8');
            return;
        }
        catch {
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
    if (live.guid)
        persistMachineIdCache(live.id, live.guid);
    return live.id;
}
function machineIdMatchesLicense(expected) {
    const want = (expected ?? '').trim().toLowerCase();
    if (!want)
        return false;
    const guid = process.platform === 'win32' ? readMachineGuidFromRegistry() : '';
    const cache = readCache();
    if (cacheAppliesToThisPc(cache, guid) && cache.machineId === want) {
        return true;
    }
    const live = computeLive();
    if (live.id.toLowerCase() === want) {
        if (live.guid)
            persistMachineIdCache(want, live.guid);
        return true;
    }
    if (cacheAppliesToThisPc(cache, live.guid) && cache.machineId === want) {
        return true;
    }
    sleepMs(500);
    const again = computeLive();
    if (again.id.toLowerCase() === want) {
        if (again.guid)
            persistMachineIdCache(want, again.guid);
        return true;
    }
    if (cacheAppliesToThisPc(cache, again.guid) && cache.machineId === want) {
        return true;
    }
    return false;
}
function formatMachineIdDisplay(machineId) {
    const short = machineId.slice(0, 16).toUpperCase();
    return short.match(/.{1,4}/g)?.join('-') ?? short;
}
//# sourceMappingURL=machine-id.js.map