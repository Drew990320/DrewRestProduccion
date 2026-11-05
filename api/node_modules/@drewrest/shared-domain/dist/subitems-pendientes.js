"use strict";
/** Línea de pedido con producto repartible y sin reparto completo de subítems. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumaCantidadesSubitems = sumaCantidadesSubitems;
exports.unidadesRepartoObjetivo = unidadesRepartoObjetivo;
exports.detalleSubitemsPendientes = detalleSubitemsPendientes;
function sumaCantidadesSubitems(subitems) {
    if (!subitems?.length)
        return 0;
    return subitems.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}
/** Unidades internas a repartir. La cantidad comercial (la que se cobra) va aparte. */
function unidadesRepartoObjetivo(cantidadComercial, cantidadRepartoSubitems) {
    const packs = Math.max(1, Math.round(Number(cantidadComercial)) || 1);
    const porProducto = Math.max(1, Math.round(Number(cantidadRepartoSubitems ?? 1)) || 1);
    return packs * porProducto;
}
/**
 * True si el producto usa subítems repartibles y la suma asignada
 * no coincide con las unidades a repartir (incluye suma 0 = pendiente).
 */
function detalleSubitemsPendientes(d) {
    if (!d.usa_subitems_repartibles)
        return false;
    return (sumaCantidadesSubitems(d.subitems) !==
        unidadesRepartoObjetivo(d.cantidad, d.cantidad_reparto_subitems));
}
