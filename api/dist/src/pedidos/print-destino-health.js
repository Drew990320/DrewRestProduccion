"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printDestinoKey = printDestinoKey;
exports.esFalloDestinoCaido = esFalloDestinoCaido;
exports.marcarDestinoCaido = marcarDestinoCaido;
exports.marcarDestinoOk = marcarDestinoOk;
exports.destinoPrintCaido = destinoPrintCaido;
exports.registrarFailFastDestino = registrarFailFastDestino;
exports.snapshotPrintDestinoHealth = snapshotPrintDestinoHealth;
exports.resetPrintDestinoHealthForTests = resetPrintDestinoHealthForTests;
const DEFAULT_DOWN_MS = 12_000;
const downUntil = new Map();
let opens = 0;
let failFast = 0;
function printDestinoKey(destino) {
    return destino.trim().toLowerCase();
}
function esFalloDestinoCaido(err) {
    const m = err.toLowerCase();
    return /econnrefused|enotfound|ehostunreach|enotconn|could not open|no se pudo abrir|openprinter|impresora no encontrada|access is denied/.test(m);
}
function marcarDestinoCaido(destino, reason, ms = DEFAULT_DOWN_MS) {
    const key = printDestinoKey(destino);
    const prev = downUntil.get(key);
    if (!prev || prev.until < Date.now())
        opens += 1;
    downUntil.set(key, { until: Date.now() + ms, reason });
}
function marcarDestinoOk(destino) {
    downUntil.delete(printDestinoKey(destino));
}
function destinoPrintCaido(destino) {
    const row = downUntil.get(printDestinoKey(destino));
    if (!row)
        return { caido: false };
    const restante = row.until - Date.now();
    if (restante <= 0) {
        downUntil.delete(printDestinoKey(destino));
        return { caido: false };
    }
    return { caido: true, reason: row.reason, restante_ms: restante };
}
function registrarFailFastDestino() {
    failFast += 1;
}
function snapshotPrintDestinoHealth() {
    const now = Date.now();
    const circuitos_abiertos = [];
    for (const [destino, row] of downUntil) {
        const restante_ms = row.until - now;
        if (restante_ms > 0) {
            circuitos_abiertos.push({
                destino,
                reason: row.reason,
                restante_ms,
            });
        }
    }
    return {
        circuitos_abiertos,
        circuitos_abiertos_total: opens,
        fail_fast: failFast,
    };
}
function resetPrintDestinoHealthForTests() {
    downUntil.clear();
    opens = 0;
    failFast = 0;
}
//# sourceMappingURL=print-destino-health.js.map