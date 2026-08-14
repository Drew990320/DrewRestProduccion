"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESC_POS_PAPER_STATUS_QUERY = void 0;
exports.parseEstadoPapelDesdeChunks = parseEstadoPapelDesdeChunks;
exports.consultarPapelSerial = consultarPapelSerial;
const serialport_loader_1 = require("./serialport-loader");
function esByteEstadoEscPos(b) {
    return (b & 0x93) === 0x12;
}
function ticketPendienteDesdeByte(b) {
    if (!esByteEstadoEscPos(b))
        return null;
    if ((b & 0x0c) !== 0)
        return true;
    if ((b & 0x20) !== 0)
        return false;
    return null;
}
function extraerBytesEstado(chunks) {
    const out = [];
    for (const chunk of chunks) {
        for (const b of chunk) {
            if (esByteEstadoEscPos(b))
                out.push(b);
        }
    }
    return out;
}
exports.ESC_POS_PAPER_STATUS_QUERY = Buffer.from([
    0x10, 0x04, 0x03,
    0x10, 0x04, 0x04,
    0x10, 0x04, 0x05,
    0x10, 0x04, 0x08, 0x03,
]);
function parseEstadoPapelDesdeChunks(chunks) {
    return parseRespuestas(chunks);
}
async function consultarPapelSerial(comPath, baudRate) {
    const SerialPort = await (0, serialport_loader_1.loadSerialPortClass)();
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            resolve(value);
        };
        const port = new SerialPort({ path: comPath, baudRate, autoOpen: false }, () => { });
        const chunks = [];
        const timeout = setTimeout(() => {
            port.removeListener('data', onData);
            port.close(() => finish(parseRespuestas(chunks)));
        }, 550);
        const onData = (chunk) => {
            chunks.push(chunk);
            const estados = extraerBytesEstado(chunks);
            if (estados.length >= 4) {
                port.removeListener('data', onData);
                port.close(() => finish(parseRespuestas(chunks)));
            }
        };
        port.open((openErr) => {
            if (openErr) {
                finish(null);
                return;
            }
            port.on('data', onData);
            port.write(exports.ESC_POS_PAPER_STATUS_QUERY, (writeErr) => {
                if (writeErr) {
                    port.removeListener('data', onData);
                    port.close(() => finish(null));
                }
            });
        });
    });
}
function parseRespuestas(chunks) {
    const estados = extraerBytesEstado(chunks);
    if (estados.length < 2)
        return null;
    const errByte = estados[0] ?? 0;
    const rollByte = estados[1] ?? 0;
    const sinPapelErr = (errByte & 0x20) !== 0;
    const sinPapelRoll = (rollByte & 0x20) === 0;
    const papelBajo = (rollByte & 0x04) !== 0;
    let ticketPendiente = null;
    for (let i = 2; i < estados.length; i++) {
        const parsed = ticketPendienteDesdeByte(estados[i]);
        if (parsed === true) {
            ticketPendiente = true;
            break;
        }
        if (parsed === false) {
            ticketPendiente = false;
        }
    }
    return {
        sinPapel: sinPapelErr || sinPapelRoll,
        papelBajo,
        ticketPendiente,
    };
}
//# sourceMappingURL=escpos-paper-status.js.map