"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANCHOS_PAPEL_MM = void 0;
exports.normalizarAnchoPapelMm = normalizarAnchoPapelMm;
exports.charsPorLineaParaPapelMm = charsPorLineaParaPapelMm;
exports.logoAnchoPxParaPapelMm = logoAnchoPxParaPapelMm;
exports.papelMmDesdeChars = papelMmDesdeChars;
exports.clampCharsPorLinea = clampCharsPorLinea;
exports.ANCHOS_PAPEL_MM = [58, 80];
function normalizarAnchoPapelMm(value) {
    const n = Number(value);
    if (n >= 80)
        return 80;
    return 58;
}
function charsPorLineaParaPapelMm(mm) {
    return normalizarAnchoPapelMm(mm) === 80 ? 48 : 32;
}
function logoAnchoPxParaPapelMm(mm) {
    return normalizarAnchoPapelMm(mm) === 80 ? 576 : 384;
}
function papelMmDesdeChars(chars) {
    return chars >= 40 ? 80 : 58;
}
function clampCharsPorLinea(chars, fallback = 32) {
    return Number.isFinite(chars) && chars >= 24 && chars <= 48
        ? Math.round(chars)
        : fallback;
}
//# sourceMappingURL=impresora-papel-ancho.js.map