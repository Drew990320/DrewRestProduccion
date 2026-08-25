"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedRestauranteAcceso = getCachedRestauranteAcceso;
exports.setCachedRestauranteAcceso = setCachedRestauranteAcceso;
exports.invalidateRestauranteAcceso = invalidateRestauranteAcceso;
const TTL_MS = 60_000;
const cache = new Map();
function getCachedRestauranteAcceso(idRestaurante) {
    const entry = cache.get(idRestaurante);
    if (!entry || entry.expiresAt <= Date.now()) {
        if (entry)
            cache.delete(idRestaurante);
        return null;
    }
    return entry.row;
}
function setCachedRestauranteAcceso(idRestaurante, row) {
    cache.set(idRestaurante, { row, expiresAt: Date.now() + TTL_MS });
}
function invalidateRestauranteAcceso(idRestaurante) {
    if (idRestaurante == null) {
        cache.clear();
        return;
    }
    cache.delete(idRestaurante);
}
//# sourceMappingURL=restaurante-acceso-cache.js.map