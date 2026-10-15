"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidarSnapshotsTenant = invalidarSnapshotsTenant;
exports.snapshotTenant = snapshotTenant;
const entries = new Map();
let generacion = 0;
function invalidarSnapshotsTenant() {
    generacion += 1;
    entries.clear();
}
function snapshotTenant(clave, ttlMs, cargar) {
    const ahora = Date.now();
    const hit = entries.get(clave);
    if (hit && hit.generacion === generacion && hit.expira > ahora) {
        return hit.valor;
    }
    const gen = generacion;
    const valor = cargar();
    entries.set(clave, { generacion: gen, expira: ahora + ttlMs, valor });
    valor.catch(() => {
        const actual = entries.get(clave);
        if (actual?.valor === valor)
            entries.delete(clave);
    });
    return valor;
}
//# sourceMappingURL=tenant-snapshot-cache.js.map