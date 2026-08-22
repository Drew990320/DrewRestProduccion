"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarMac = normalizarMac;
exports.macsIguales = macsIguales;
exports.extraerMacDeArp = extraerMacDeArp;
exports.extraerTablaArp = extraerTablaArp;
exports.buscarIpDeMacEnArp = buscarIpDeMacEnArp;
const MAC_RE = /^([0-9a-f]{2})[:\-]?([0-9a-f]{2})[:\-]?([0-9a-f]{2})[:\-]?([0-9a-f]{2})[:\-]?([0-9a-f]{2})[:\-]?([0-9a-f]{2})$/i;
function normalizarMac(raw) {
    const s = String(raw ?? '').trim();
    if (!s)
        return null;
    const m = s.match(MAC_RE);
    if (!m)
        return null;
    const mac = m
        .slice(1, 7)
        .map((p) => p.toLowerCase())
        .join(':');
    if (mac === '00:00:00:00:00:00' || mac === 'ff:ff:ff:ff:ff:ff')
        return null;
    return mac;
}
function macsIguales(a, b) {
    const na = normalizarMac(a);
    const nb = normalizarMac(b);
    return na != null && nb != null && na === nb;
}
function extraerMacDeArp(stdout, host) {
    const ip = host.trim();
    const lines = stdout.split(/\r?\n/);
    for (const line of lines) {
        if (!line.includes(ip))
            continue;
        const macTok = line.match(/([0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2})/i);
        if (macTok)
            return normalizarMac(macTok[1]);
    }
    const any = stdout.match(/([0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2})/i);
    return any ? normalizarMac(any[1]) : null;
}
function extraerTablaArp(stdout) {
    const rows = [];
    const re = /((?:\d{1,3}\.){3}\d{1,3})\s+([0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2})/gi;
    let m;
    while ((m = re.exec(stdout))) {
        const mac = normalizarMac(m[2]);
        if (!mac)
            continue;
        rows.push({ ip: m[1], mac });
    }
    return rows;
}
function buscarIpDeMacEnArp(stdout, macEsperada) {
    const want = normalizarMac(macEsperada);
    if (!want)
        return null;
    for (const row of extraerTablaArp(stdout)) {
        if (row.mac === want)
            return row.ip;
    }
    return null;
}
//# sourceMappingURL=impresora-mac.js.map