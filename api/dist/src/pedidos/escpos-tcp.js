"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDestinoTcp = parseDestinoTcp;
exports.sendEscPosTcp = sendEscPosTcp;
exports.consultarPapelTcp = consultarPapelTcp;
const node_net_1 = __importDefault(require("node:net"));
const escpos_paper_status_1 = require("./escpos-paper-status");
const DEFAULT_ESCPOS_TCP_PORT = 9100;
function parseDestinoTcp(destino) {
    const t = destino.trim();
    if (!t)
        return null;
    let host;
    let port = DEFAULT_ESCPOS_TCP_PORT;
    const tcpPref = t.match(/^tcp:(.+)$/i);
    if (tcpPref) {
        const rest = tcpPref[1].trim();
        const withPort = rest.match(/^(.+):(\d{2,5})$/);
        if (withPort) {
            host = withPort[1].trim();
            port = Number(withPort[2]);
        }
        else {
            host = rest;
        }
    }
    else {
        const ipPort = t.match(/^((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})$/);
        if (!ipPort)
            return null;
        host = ipPort[1].trim();
        port = Number(ipPort[2]);
    }
    if (!host || host.includes(' ') || host.length > 253)
        return null;
    if (!Number.isFinite(port) || port < 1 || port > 65535)
        return null;
    return { host, port };
}
async function sendEscPosTcp(host, port, buffer, timeoutMs = 8_000) {
    await new Promise((resolve, reject) => {
        const socket = new node_net_1.default.Socket();
        let settled = false;
        const finish = (err) => {
            if (settled)
                return;
            settled = true;
            socket.destroy();
            if (err)
                reject(err);
            else
                resolve();
        };
        socket.setTimeout(timeoutMs);
        socket.once('timeout', () => finish(new Error(`Timeout al imprimir en ${host}:${port}`)));
        socket.once('error', (e) => finish(e instanceof Error ? e : new Error(String(e))));
        socket.connect(port, host, () => {
            socket.write(buffer, (writeErr) => {
                if (writeErr) {
                    finish(writeErr);
                    return;
                }
                socket.end(() => finish());
            });
        });
    });
}
async function consultarPapelTcp(host, port, timeoutMs = 800) {
    return new Promise((resolve) => {
        const socket = new node_net_1.default.Socket();
        const chunks = [];
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            socket.destroy();
            resolve(value);
        };
        const timer = setTimeout(() => finish((0, escpos_paper_status_1.parseEstadoPapelDesdeChunks)(chunks)), timeoutMs);
        socket.once('error', () => finish(null));
        socket.on('data', (chunk) => {
            chunks.push(chunk);
            const parsed = (0, escpos_paper_status_1.parseEstadoPapelDesdeChunks)(chunks);
            if (parsed?.ticketPendiente != null)
                finish(parsed);
        });
        socket.setTimeout(timeoutMs);
        socket.connect(port, host, () => {
            socket.write(escpos_paper_status_1.ESC_POS_PAPER_STATUS_QUERY, (err) => {
                if (err)
                    finish(null);
            });
        });
    });
}
//# sourceMappingURL=escpos-tcp.js.map