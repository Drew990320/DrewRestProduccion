"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUERTO_WEB_POR_DEFECTO = void 0;
exports.resolvePreferredLanIp = resolvePreferredLanIp;
exports.elegirCandidatoRed = elegirCandidatoRed;
exports.detectarRedLocal = detectarRedLocal;
exports.listarRedesLocales = listarRedesLocales;
exports.candidatosArchivoPuertoWeb = candidatosArchivoPuertoWeb;
exports.detectarPuertoWeb = detectarPuertoWeb;
exports.leerPuertoWebDesdeArchivo = leerPuertoWebDesdeArchivo;
exports.leerPuertoWeb = leerPuertoWeb;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = __importDefault(require("os"));
const EXCLUDE = /loopback|virtualbox|vmware|hyper-v|vethernet|wsl|docker|virtual|tap|tun|npcap|bluetooth|vpn|host-only|default switch|kernel debug/i;
const WIFI = /wi-?fi|wlan|wireless|802\.11/i;
const ETH = /ethernet|etherneto|área local|lan\b/i;
function ipv4Valida(ip) {
    if (ip.startsWith('127.'))
        return false;
    if (ip.startsWith('169.254.'))
        return false;
    if (ip.startsWith('192.168.56.'))
        return false;
    return true;
}
function resolvePreferredLanIp() {
    const raw = process.env.SERVER_LAN_IP?.trim() ||
        process.env.LAN_PREFERRED_IP?.trim() ||
        '';
    if (!raw || !/^\d{1,3}(\.\d{1,3}){3}$/.test(raw))
        return null;
    if (!ipv4Valida(raw))
        return null;
    return raw;
}
function elegirCandidatoRed(candidatos, preferredIp = resolvePreferredLanIp()) {
    if (candidatos.length === 0)
        return null;
    if (preferredIp) {
        const match = candidatos.find((c) => c.ip === preferredIp);
        if (match) {
            return { ip: match.ip, adaptador: match.adaptador, tipo: match.tipo };
        }
    }
    const ordenados = [...candidatos].sort((a, b) => b.prioridad - a.prioridad);
    const mejor = ordenados[0];
    return { ip: mejor.ip, adaptador: mejor.adaptador, tipo: mejor.tipo };
}
function detectarRedLocal() {
    const candidatos = listarCandidatosRedLocal();
    return elegirCandidatoRed(candidatos);
}
function listarRedesLocales() {
    const candidatos = listarCandidatosRedLocal();
    if (candidatos.length === 0)
        return [];
    const chosen = elegirCandidatoRed(candidatos);
    const ordenados = [...candidatos].sort((a, b) => b.prioridad - a.prioridad);
    if (!chosen)
        return ordenados.map(({ ip, adaptador, tipo }) => ({ ip, adaptador, tipo }));
    const rest = ordenados.filter((c) => c.ip !== chosen.ip);
    return [chosen, ...rest].map(({ ip, adaptador, tipo }) => ({ ip, adaptador, tipo }));
}
function listarCandidatosRedLocal() {
    const nets = os_1.default.networkInterfaces();
    const candidatos = [];
    for (const [nombre, addrs] of Object.entries(nets)) {
        if (!addrs || EXCLUDE.test(nombre))
            continue;
        const ipv4 = addrs.find((a) => a.family === 'IPv4' && ipv4Valida(a.address));
        if (!ipv4)
            continue;
        let tipo = 'otro';
        let prioridad = 1;
        if (WIFI.test(nombre)) {
            tipo = 'wifi';
            prioridad = /^wi-?fi$/i.test(nombre.trim()) ? 4 : 3;
        }
        else if (ETH.test(nombre)) {
            tipo = 'ethernet';
            prioridad = 2;
        }
        candidatos.push({
            ip: ipv4.address,
            adaptador: nombre,
            tipo,
            prioridad,
        });
    }
    return candidatos;
}
exports.PUERTO_WEB_POR_DEFECTO = 8080;
function esRutaPuertoWebConfiable(filePath) {
    const norm = filePath.replace(/\\/g, '/').toLowerCase();
    if (/release-staging|\/backups\/|node_modules|distribucion-setup/.test(norm)) {
        return false;
    }
    return true;
}
function leerPuertoDesdeArchivo(filePath) {
    if (!esRutaPuertoWebConfiable(filePath))
        return null;
    if (!(0, fs_1.existsSync)(filePath))
        return null;
    try {
        const raw = (0, fs_1.readFileSync)(filePath, 'utf8').trim();
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    catch {
    }
    return null;
}
function candidatosArchivoPuertoWeb(cwd = process.cwd()) {
    const anchors = [
        cwd,
        (0, path_1.join)(cwd, '..'),
        (0, path_1.join)(cwd, '../..'),
        (0, path_1.join)(cwd, '../../..'),
    ];
    const suffixes = [
        ['DrewRest', 'web', 'web-port.txt'],
        ['web', 'web-port.txt'],
        ['apps', 'mobile', 'public', 'web-port.txt'],
    ];
    const out = [];
    for (const anchor of anchors) {
        for (const parts of suffixes) {
            out.push((0, path_1.join)(anchor, ...parts));
        }
    }
    return [...new Set(out)];
}
function detectarPuertoWeb(cwd = process.cwd()) {
    const fromEnv = Number(process.env.WEB_PORT);
    if (Number.isFinite(fromEnv) && fromEnv > 0) {
        return { puerto: fromEnv, origen: 'env' };
    }
    for (const p of candidatosArchivoPuertoWeb(cwd)) {
        const n = leerPuertoDesdeArchivo(p);
        if (n != null)
            return { puerto: n, origen: 'archivo', archivo: p };
    }
    return { puerto: exports.PUERTO_WEB_POR_DEFECTO, origen: 'defecto' };
}
function leerPuertoWebDesdeArchivo(cwd = process.cwd()) {
    for (const p of candidatosArchivoPuertoWeb(cwd)) {
        const n = leerPuertoDesdeArchivo(p);
        if (n != null)
            return n;
    }
    return null;
}
function leerPuertoWeb() {
    return detectarPuertoWeb().puerto;
}
//# sourceMappingURL=red-local.js.map