"use strict";
/**
 * Protocolo de descubrimiento LAN DrewRest (sin Internet).
 * Compartido entre API (UDP responder) y clientes (HTTP/UDP probe).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAN_DISCOVERY_DEFAULT_UDP_PORT = exports.LAN_DISCOVERY_VERSION = exports.LAN_DISCOVERY_RESPONSE_TYPE = exports.LAN_DISCOVERY_MAGIC = void 0;
exports.isPrivateIpv4Host = isPrivateIpv4Host;
exports.ipv4Prefix = ipv4Prefix;
exports.buildNearbyLanUrls = buildNearbyLanUrls;
exports.buildSubnetScanUrls = buildSubnetScanUrls;
exports.buildLanDiscoveryResponse = buildLanDiscoveryResponse;
exports.parseLanDiscoveryResponse = parseLanDiscoveryResponse;
exports.lanDiscoveryResponseToBaseUrl = lanDiscoveryResponseToBaseUrl;
exports.LAN_DISCOVERY_MAGIC = 'DREWREST_DISCOVER_v1';
exports.LAN_DISCOVERY_RESPONSE_TYPE = 'drewrest_discovery';
exports.LAN_DISCOVERY_VERSION = 1;
exports.LAN_DISCOVERY_DEFAULT_UDP_PORT = 41234;
function isPrivateIpv4Host(host) {
    if (host === 'localhost' || host === '127.0.0.1')
        return true;
    if (/^192\.168\./.test(host))
        return true;
    if (/^10\./.test(host))
        return true;
    const m = /^172\.(\d+)\./.exec(host);
    if (m) {
        const n = Number(m[1]);
        if (n >= 16 && n <= 31)
            return true;
    }
    return false;
}
/** Prefijo /24 de una IPv4, p. ej. 192.168.0.198 → 192.168.0 */
function ipv4Prefix(ip) {
    const parts = ip.trim().split('.');
    if (parts.length !== 4)
        return null;
    if (parts.some((p) => !/^\d+$/.test(p) || Number(p) > 255))
        return null;
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
}
/** Candidatos cercanos (±5 y gateways típicos) — fase rápida. */
function buildNearbyLanUrls(host, port) {
    const p = String(port || '3000');
    if (!isPrivateIpv4Host(host) || host === 'localhost' || host === '127.0.0.1') {
        return [];
    }
    const parts = host.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n)))
        return [];
    const [a, b, c, d] = parts;
    const out = [];
    const push = (octet) => {
        if (octet < 1 || octet > 254 || octet === d)
            return;
        out.push(`http://${a}.${b}.${c}.${octet}:${p}`);
    };
    for (const delta of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5])
        push(d + delta);
    for (const gw of [1, 254, 100, 10, 20, 50])
        push(gw);
    return out;
}
/** Escaneo /24 completo — solo en rediscovery tras fallo (DHCP). */
function buildSubnetScanUrls(prefix, port, opts) {
    const p = String(port || '3000');
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(prefix))
        return [];
    const exclude = opts?.excludeHost?.trim();
    const out = [];
    for (let octet = 1; octet <= 254; octet++) {
        const host = `${prefix}.${octet}`;
        if (exclude && host === exclude)
            continue;
        out.push(`http://${host}:${p}`);
    }
    return out;
}
function buildLanDiscoveryResponse(input) {
    return {
        type: exports.LAN_DISCOVERY_RESPONSE_TYPE,
        version: exports.LAN_DISCOVERY_VERSION,
        service: 'drewrest-api',
        host: input.host.trim(),
        port: input.port,
        protocol: input.protocol ?? 'http',
    };
}
function parseLanDiscoveryResponse(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (parsed.type !== exports.LAN_DISCOVERY_RESPONSE_TYPE)
            return null;
        if (parsed.version !== exports.LAN_DISCOVERY_VERSION)
            return null;
        if (parsed.service !== 'drewrest-api')
            return null;
        if (typeof parsed.host !== 'string' || !parsed.host.trim())
            return null;
        const port = Number(parsed.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535)
            return null;
        const protocol = parsed.protocol === 'https' ? 'https' : 'http';
        if (!isPrivateIpv4Host(parsed.host) && parsed.host !== 'localhost') {
            /* LAN: solo hosts privados */
            if (!/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(parsed.host)) {
                return null;
            }
        }
        return {
            type: exports.LAN_DISCOVERY_RESPONSE_TYPE,
            version: exports.LAN_DISCOVERY_VERSION,
            service: 'drewrest-api',
            host: parsed.host.trim(),
            port,
            protocol,
        };
    }
    catch {
        return null;
    }
}
function lanDiscoveryResponseToBaseUrl(r) {
    return `${r.protocol}://${r.host}:${r.port}`;
}
