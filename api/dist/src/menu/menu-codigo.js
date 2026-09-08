"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarCodigoCategoriaMenu = normalizarCodigoCategoriaMenu;
exports.secuenciaDesdeCodigoProducto = secuenciaDesdeCodigoProducto;
exports.normalizarCodigoProductoMenu = normalizarCodigoProductoMenu;
exports.siguienteCodigoCategoria = siguienteCodigoCategoria;
exports.siguienteCodigoProducto = siguienteCodigoProducto;
exports.esBusquedaPorCodigoMenu = esBusquedaPorCodigoMenu;
const common_1 = require("@nestjs/common");
function normalizarCodigoCategoriaMenu(raw) {
    if (raw == null)
        return null;
    const digits = String(raw).replace(/\D/g, '');
    if (!digits)
        return null;
    const n = Number(digits);
    if (!Number.isFinite(n) || n < 1 || n > 99) {
        throw new common_1.BadRequestException('El código de categoría debe ser un número entre 01 y 99');
    }
    return String(n).padStart(2, '0');
}
function secuenciaDesdeCodigoProducto(codigoProducto, codigoCategoria) {
    if (!codigoProducto.startsWith(codigoCategoria))
        return null;
    const rest = codigoProducto.slice(codigoCategoria.length);
    if (!/^\d+$/.test(rest))
        return null;
    const n = Number(rest);
    return Number.isFinite(n) && n >= 1 ? n : null;
}
function normalizarCodigoProductoMenu(raw, codigoCategoria) {
    if (raw == null)
        return null;
    const digits = String(raw).replace(/\D/g, '');
    if (!digits)
        return null;
    if (!/^\d{2}$/.test(codigoCategoria)) {
        throw new common_1.BadRequestException('La categoría no tiene código de menú válido');
    }
    let seq;
    if (digits.startsWith(codigoCategoria) && digits.length > 2) {
        seq = Number(digits.slice(2));
    }
    else {
        seq = Number(digits);
    }
    if (!Number.isFinite(seq) || seq < 1 || seq > 9999) {
        throw new common_1.BadRequestException('El código del plato debe ser el de la categoría más el número del ítem (ej. 011)');
    }
    return `${codigoCategoria}${seq}`;
}
function siguienteCodigoCategoria(ocupados) {
    const used = new Set(ocupados
        .map((c) => normalizarCodigoCategoriaMenu(c))
        .filter((c) => c != null));
    for (let i = 1; i <= 99; i++) {
        const code = String(i).padStart(2, '0');
        if (!used.has(code))
            return code;
    }
    throw new common_1.BadRequestException('No quedan códigos de categoría libres (01–99)');
}
function siguienteCodigoProducto(codigoCategoria, ocupadosEnCategoria) {
    let max = 0;
    for (const c of ocupadosEnCategoria) {
        const seq = secuenciaDesdeCodigoProducto(c, codigoCategoria);
        if (seq != null && seq > max)
            max = seq;
    }
    return `${codigoCategoria}${max + 1}`;
}
function esBusquedaPorCodigoMenu(q) {
    return /^\d+$/.test(q.trim());
}
//# sourceMappingURL=menu-codigo.js.map