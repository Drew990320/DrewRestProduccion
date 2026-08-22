"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverIdentidadLan = resolverIdentidadLan;
exports.invalidarCacheArp = invalidarCacheArp;
exports.listarTablaArp = listarTablaArp;
exports.buscarHostPorMac = buscarHostPorMac;
exports.tocarHosts = tocarHosts;
const child_process_1 = require("child_process");
const node_net_1 = __importDefault(require("node:net"));
const util_1 = require("util");
const impresora_mac_1 = require("./impresora-mac");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const arpCache = new Map();
const ARP_TTL_MS = 8_000;
async function tocarArp(host, port) {
    return new Promise((resolve) => {
        const socket = new node_net_1.default.Socket();
        const done = (ok) => {
            socket.destroy();
            resolve(ok);
        };
        const t = setTimeout(() => done(false), 900);
        socket.once('error', () => {
            clearTimeout(t);
            done(false);
        });
        socket.connect(port, host, () => {
            clearTimeout(t);
            done(true);
        });
    });
}
async function arpWindows(host) {
    try {
        const { stdout } = await execFileAsync('arp', ['-a', host], {
            timeout: 4_000,
            windowsHide: true,
        });
        return (0, impresora_mac_1.extraerMacDeArp)(stdout, host);
    }
    catch {
    }
    try {
        const { stdout } = await execFileAsync('powershell.exe', [
            '-NoProfile',
            '-Command',
            `Get-NetNeighbor -IPAddress '${host.replace(/'/g, '')}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LinkLayerAddress`,
        ], { timeout: 6_000, windowsHide: true });
        return (0, impresora_mac_1.extraerMacDeArp)(stdout, host);
    }
    catch {
        return null;
    }
}
async function arpPosix(host) {
    try {
        const { stdout } = await execFileAsync('arp', ['-n', host], {
            timeout: 4_000,
        });
        return (0, impresora_mac_1.extraerMacDeArp)(stdout, host);
    }
    catch {
        return null;
    }
}
async function resolverIdentidadLan(host, port = 9100) {
    const key = `${host}:${port}`;
    const hit = arpCache.get(key);
    if (hit && Date.now() - hit.at < ARP_TTL_MS) {
        return { host, reachable: hit.mac != null, mac: hit.mac };
    }
    const reachable = await tocarArp(host, port);
    const mac = process.platform === 'win32'
        ? await arpWindows(host)
        : await arpPosix(host);
    arpCache.set(key, { mac, at: Date.now() });
    return { host, reachable, mac };
}
function invalidarCacheArp(host) {
    if (!host) {
        arpCache.clear();
        return;
    }
    for (const k of arpCache.keys()) {
        if (k.startsWith(`${host}:`))
            arpCache.delete(k);
    }
}
async function listarTablaArp() {
    try {
        const { stdout } = await execFileAsync('arp', ['-a'], {
            timeout: 5_000,
            windowsHide: true,
        });
        return stdout;
    }
    catch {
        return '';
    }
}
async function buscarHostPorMac(macEsperada) {
    const tabla = await listarTablaArp();
    return (0, impresora_mac_1.buscarIpDeMacEnArp)(tabla, macEsperada);
}
async function tocarHosts(hosts) {
    await Promise.all(hosts.map((h) => tocarArp(h.host, h.port)));
}
//# sourceMappingURL=impresora-arp.js.map