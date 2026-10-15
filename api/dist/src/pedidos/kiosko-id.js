"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KIOSKO_ID_PATTERN = void 0;
exports.normalizarKioskoId = normalizarKioskoId;
exports.filtroPedidosKiosko = filtroPedidosKiosko;
exports.KIOSKO_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
function normalizarKioskoId(raw) {
    if (typeof raw !== 'string')
        return null;
    const v = raw.trim();
    return exports.KIOSKO_ID_PATTERN.test(v) ? v : null;
}
function filtroPedidosKiosko(kioskoId) {
    if (!kioskoId)
        return {};
    return { OR: [{ kioskoId }, { kioskoId: null }] };
}
//# sourceMappingURL=kiosko-id.js.map