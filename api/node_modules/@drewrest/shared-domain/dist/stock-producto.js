"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INGRESO_RAPIDO_CANTIDAD_MAX = void 0;
exports.esProductoIngresoRapidoVendible = esProductoIngresoRapidoVendible;
exports.esProductoLoteVendible = esProductoLoteVendible;
exports.cantidadIngresoRapidoValida = cantidadIngresoRapidoValida;
exports.productoAgotado = productoAgotado;
exports.productoVisibleEnMenu = productoVisibleEnMenu;
exports.puedePedirCantidad = puedePedirCantidad;
exports.stockEtiqueta = stockEtiqueta;
/** Máximo razonable para un ingreso rápido (evita ceros de más). */
exports.INGRESO_RAPIDO_CANTIDAD_MAX = 9999;
/** Vendible con contador de menú (bebida, porción, etc.). */
function esProductoIngresoRapidoVendible(p) {
    return p.activo !== false && Boolean(p.control_stock);
}
/** Cualquier vendible con stock: lote de unidades (gaseosa, porción, etc.). */
function esProductoLoteVendible(p) {
    return p.activo !== false && Boolean(p.control_stock);
}
function cantidadIngresoRapidoValida(n) {
    return Number.isInteger(n) && n >= 1 && n <= exports.INGRESO_RAPIDO_CANTIDAD_MAX;
}
function productoAgotado(p) {
    return Boolean(p.control_stock) && Math.max(0, p.stock_disponible ?? 0) <= 0;
}
/** Si el producto debe listarse en el menú del día. */
function productoVisibleEnMenu(p) {
    if (p.activo === false)
        return false;
    if (!productoAgotado(p))
        return true;
    return p.ocultar_sin_stock === false;
}
function puedePedirCantidad(p, cantidad) {
    if (cantidad < 1)
        return false;
    if (!p.control_stock)
        return true;
    return (p.stock_disponible ?? 0) >= cantidad;
}
function stockEtiqueta(p) {
    if (!p.control_stock)
        return null;
    const n = Math.max(0, p.stock_disponible ?? 0);
    if (n <= 0)
        return 'Agotado';
    return `Quedan ${n}`;
}
