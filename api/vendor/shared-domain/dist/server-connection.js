"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_CONNECTION_QR_VERSION = exports.SERVER_CONNECTION_QR_TYPE = void 0;
exports.isForbiddenPairHost = isForbiddenPairHost;
exports.isValidServerHost = isValidServerHost;
exports.isValidServerPort = isValidServerPort;
exports.normalizeApiBasePath = normalizeApiBasePath;
exports.unwrapNipIoHost = unwrapNipIoHost;
exports.serverConnectionToBaseUrl = serverConnectionToBaseUrl;
exports.parseBaseUrlToServerConnection = parseBaseUrlToServerConnection;
exports.buildServerConnection = buildServerConnection;
exports.buildServerConnectionQr = buildServerConnectionQr;
exports.buildServerConnectionQrString = buildServerConnectionQrString;
exports.isApkDownloadPayload = isApkDownloadPayload;
exports.parseServerConnectionInput = parseServerConnectionInput;
exports.sanitizeServerBaseUrl = sanitizeServerBaseUrl;
exports.isUsableLanServerUrl = isUsableLanServerUrl;
exports.serverConnectionToInputHostPort = serverConnectionToInputHostPort;
exports.SERVER_CONNECTION_QR_TYPE = 'server_connection';
exports.SERVER_CONNECTION_QR_VERSION = 1;
const FORBIDDEN_HOSTS = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '[::1]',
    'ip6-localhost',
]);
const HOSTNAME_RE = /^(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/i;
const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
function isForbiddenPairHost(host) {
    const h = unwrapNipIoHost(host.trim().toLowerCase());
    return FORBIDDEN_HOSTS.has(h);
}
function isValidServerHost(host) {
    const h = unwrapNipIoHost(host.trim());
    if (!h || h.length > 253)
        return false;
    if (isForbiddenPairHost(h))
        return false;
    return IPV4_RE.test(h) || HOSTNAME_RE.test(h);
}
function isValidServerPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
}
function normalizeApiBasePath(raw) {
    if (raw == null || raw === '')
        return '';
    if (typeof raw !== 'string')
        return null;
    const t = raw.trim();
    if (!t || t === '/')
        return '';
    if (t.includes('..') || t.includes('\\') || /\s/.test(t))
        return null;
    if (!t.startsWith('/'))
        return null;
    return t.replace(/\/$/, '');
}
function unwrapNipIoHost(hostname) {
    const m = /^((?:\d{1,3}\.){3}\d{1,3})\.nip\.io$/i.exec(hostname.trim());
    return m ? m[1] : hostname.trim();
}
function serverConnectionToBaseUrl(cfg) {
    const path = cfg.apiBasePath || '';
    return `${cfg.protocol}://${cfg.host}:${cfg.port}${path}`;
}
function parseBaseUrlToServerConnection(raw) {
    const sanitized = sanitizeServerBaseUrl(raw);
    if (!sanitized)
        return null;
    try {
        const u = new URL(sanitized);
        const protocol = u.protocol === 'https:' ? 'https' : 'http';
        const host = unwrapNipIoHost(u.hostname);
        const port = u.port
            ? Number(u.port)
            : protocol === 'https'
                ? 443
                : 3000;
        const apiBasePath = u.pathname === '/api' ? '/api' : '';
        if (!isValidServerPort(port) || !host)
            return null;
        return { host, port, protocol, apiBasePath };
    }
    catch {
        return null;
    }
}
function buildServerConnection(input) {
    const hostRaw = String(input.host ?? '').trim();
    if (/^https?:\/\//i.test(hostRaw) || /^drewrest:/i.test(hostRaw) || /^intent:/i.test(hostRaw)) {
        const parsed = parseServerConnectionInput(hostRaw);
        if (!parsed)
            return null;
        const apiBasePath = normalizeApiBasePath(input.apiBasePath ?? parsed.apiBasePath);
        if (apiBasePath == null)
            return null;
        return { ...parsed, apiBasePath };
    }
    const hostAndPort = /^([^:\s/]+):(\d{1,5})$/.exec(hostRaw);
    if (hostAndPort) {
        return buildServerConnection({
            host: hostAndPort[1],
            port: hostAndPort[2],
            protocol: input.protocol,
            apiBasePath: input.apiBasePath,
        });
    }
    const host = unwrapNipIoHost(hostRaw);
    const port = typeof input.port === 'number' ? input.port : Number(String(input.port).trim());
    const protocolRaw = (input.protocol ?? 'http').trim().toLowerCase();
    const protocol = protocolRaw === 'http' || protocolRaw === 'https' ? protocolRaw : null;
    const apiBasePath = normalizeApiBasePath(input.apiBasePath ?? '');
    if (!protocol || !isValidServerHost(host) || !isValidServerPort(port) || apiBasePath == null) {
        return null;
    }
    return { host, port, protocol, apiBasePath };
}
function buildServerConnectionQr(cfg) {
    return {
        type: exports.SERVER_CONNECTION_QR_TYPE,
        version: exports.SERVER_CONNECTION_QR_VERSION,
        host: cfg.host,
        port: cfg.port,
        protocol: cfg.protocol,
        apiBasePath: cfg.apiBasePath,
    };
}
function buildServerConnectionQrString(cfg) {
    return JSON.stringify(buildServerConnectionQr(cfg));
}
function isApkDownloadPayload(raw) {
    return /\/descargar-app|\/drewrest\.apk/i.test(raw.trim());
}
function parseServerConnectionQrJson(value) {
    if (!value || typeof value !== 'object')
        return null;
    const obj = value;
    if (obj.type !== exports.SERVER_CONNECTION_QR_TYPE)
        return null;
    if (obj.version !== exports.SERVER_CONNECTION_QR_VERSION)
        return null;
    return buildServerConnection({
        host: typeof obj.host === 'string' ? obj.host : '',
        port: obj.port,
        protocol: typeof obj.protocol === 'string' ? obj.protocol : '',
        apiBasePath: typeof obj.apiBasePath === 'string' ? obj.apiBasePath : '',
    });
}
function parseLegacyApiJson(value) {
    if (!value || typeof value !== 'object')
        return null;
    const obj = value;
    if (typeof obj.api !== 'string')
        return null;
    return parseBaseUrlToServerConnection(obj.api);
}
function parseAsUrl(raw) {
    let t = raw.trim();
    if (!t)
        return null;
    if (/^intent:/i.test(t)) {
        const beforeHash = t.split('#')[0];
        const scheme = (/[;]scheme=([a-z0-9]+)/i.exec(t)?.[1] || '').toLowerCase();
        const rest = beforeHash.replace(/^intent:\/\//i, '');
        if (scheme === 'http' || scheme === 'https') {
            return parseServerConnectionInput(`${scheme}://${rest}`);
        }
        return parseServerConnectionInput(`drewrest://${rest}`);
    }
    try {
        const u = new URL(t);
        if (u.protocol === 'drewrest:') {
            const api = u.searchParams.get('api') || u.searchParams.get('url');
            return api ? parseBaseUrlToServerConnection(api) : null;
        }
        if (u.protocol === 'http:' || u.protocol === 'https:') {
            if (isApkDownloadPayload(u.pathname))
                return null;
            if (/\/vincular\/?$/i.test(u.pathname) || u.searchParams.has('api')) {
                const api = u.searchParams.get('api') || u.searchParams.get('url');
                const parsed = api ? parseBaseUrlToServerConnection(api) : null;
                if (parsed)
                    return parsed;
            }
            if (/\/health\/?$/i.test(u.pathname)) {
                return parseBaseUrlToServerConnection(u.origin);
            }
            const port = u.port || (u.protocol === 'https:' ? '443' : '80');
            if (port === '3000' || /\/api$/i.test(u.pathname)) {
                return parseBaseUrlToServerConnection(u.origin + (u.pathname === '/api' ? '/api' : ''));
            }
        }
    }
    catch {
        /* no URL */
    }
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d{2,5})?$/.test(t)) {
        const withPort = t.includes(':') ? t : `${t}:3000`;
        return parseBaseUrlToServerConnection(`http://${withPort}`);
    }
    return parseBaseUrlToServerConnection(t.startsWith('http') ? t : '');
}
/**
 * Extrae host/puerto/protocolo desde QR JSON, deep link, /vincular?api=,
 * IP:puerto o URL http(s). Rechaza QR arbitrarios y el QR de descarga APK.
 */
function parseServerConnectionInput(raw) {
    const t = raw.trim();
    if (!t)
        return null;
    if (isApkDownloadPayload(t))
        return null;
    try {
        const asJson = JSON.parse(t);
        const fromTyped = parseServerConnectionQrJson(asJson);
        if (fromTyped)
            return fromTyped;
        const fromLegacy = parseLegacyApiJson(asJson);
        if (fromLegacy)
            return fromLegacy;
        return null;
    }
    catch {
        /* no JSON */
    }
    return parseAsUrl(t);
}
function sanitizeServerBaseUrl(raw) {
    if (!raw)
        return null;
    let s = raw.trim().replace(/\/$/, '');
    if (!s)
        return null;
    if (!/^https?:\/\//i.test(s)) {
        if (/^(\d{1,3}\.){3}\d{1,3}/.test(s) || /^localhost\b/i.test(s)) {
            s = `http://${s}`;
        }
        else {
            return null;
        }
    }
    try {
        const u = new URL(s);
        if (!u.hostname)
            return null;
        if (u.protocol !== 'http:' && u.protocol !== 'https:')
            return null;
        const host = unwrapNipIoHost(u.hostname);
        const port = u.port ? `:${u.port}` : '';
        const path = u.pathname === '/api' ? '/api' : '';
        return `${u.protocol}//${host}${port}${path}`.replace(/\/$/, '');
    }
    catch {
        return null;
    }
}
function isUsableLanServerUrl(url) {
    const cfg = url ? parseBaseUrlToServerConnection(url) : null;
    if (!cfg)
        return false;
    return isValidServerHost(cfg.host);
}
function serverConnectionToInputHostPort(cfg) {
    if (!cfg)
        return '';
    return `${cfg.host}:${cfg.port}`;
}
