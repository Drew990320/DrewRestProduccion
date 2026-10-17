"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aplicaControlStockProducto = aplicaControlStockProducto;
exports.aplicaControlStockBebida = aplicaControlStockBebida;
exports.descontarStockBebidaTx = descontarStockBebidaTx;
exports.reintegrarStockBebidaTx = reintegrarStockBebidaTx;
exports.leerStockMenuControladoTx = leerStockMenuControladoTx;
exports.cerrarStockMenuSiNoMovioTx = cerrarStockMenuSiNoMovioTx;
exports.ajustarStockBebidaTx = ajustarStockBebidaTx;
const common_1 = require("@nestjs/common");
const inventario_stock_producto_1 = require("../inventario/inventario-stock-producto");
async function kardexCubreStockMenu(tx, idProducto, tenantId) {
    const cfg = await tx.configRestaurante.findUnique({
        where: { idRestaurante: tenantId },
        select: { moduloInventarioActivo: true },
    });
    if (!cfg?.moduloInventarioActivo)
        return false;
    const comercial = await tx.recurso.findFirst({
        where: {
            idProducto,
            idRestaurante: tenantId,
            categoria: { puedeVenderse: true },
            estado: { not: 'baja' },
        },
        select: { idRecurso: true },
    });
    if (comercial)
        return true;
    const recetas = await tx.recetaProducto.count({
        where: { idProducto, idRestaurante: tenantId, activa: true },
    });
    return recetas > 0;
}
function aplicaControlStockProducto(p) {
    if (!p.controlStock)
        return false;
    if (p.usaProduccionPorciones)
        return true;
    return Boolean(p.categoria?.esBebida);
}
function aplicaControlStockBebida(p) {
    return aplicaControlStockProducto(p);
}
async function descontarStockBebidaTx(tx, p, cantidad) {
    if (!aplicaControlStockProducto(p) || cantidad <= 0)
        return;
    const tenantId = p.idRestaurante ?? 1;
    const inv = await (0, inventario_stock_producto_1.inventarioComercialPorProductoTx)(tx, p.idProducto, tenantId);
    if ((0, inventario_stock_producto_1.productoUsaInventarioComercial)(inv)) {
        return;
    }
    if (!p.usaProduccionPorciones && (await kardexCubreStockMenu(tx, p.idProducto, tenantId))) {
        return;
    }
    if (p.usaProduccionPorciones) {
        const actual = await tx.producto.findUnique({
            where: { idProducto: p.idProducto },
            select: { stockDisponible: true },
        });
        const qty = Math.min(cantidad, Math.max(0, actual?.stockDisponible ?? 0));
        if (qty <= 0)
            return;
        await tx.producto.updateMany({
            where: {
                idProducto: p.idProducto,
                controlStock: true,
                stockDisponible: { gte: qty },
            },
            data: { stockDisponible: { decrement: qty } },
        });
        return;
    }
    const r = await tx.producto.updateMany({
        where: {
            idProducto: p.idProducto,
            controlStock: true,
            stockDisponible: { gte: cantidad },
        },
        data: { stockDisponible: { decrement: cantidad } },
    });
    if (r.count === 0) {
        throw new common_1.BadRequestException(`Stock insuficiente de «${p.nombre}» (disponible: ${p.stockDisponible})`);
    }
}
async function reintegrarStockBebidaTx(tx, p, cantidad) {
    if (!aplicaControlStockProducto(p) || cantidad <= 0)
        return;
    const tenantId = p.idRestaurante ?? 1;
    const inv = await (0, inventario_stock_producto_1.inventarioComercialPorProductoTx)(tx, p.idProducto, tenantId);
    if ((0, inventario_stock_producto_1.productoUsaInventarioComercial)(inv)) {
        return;
    }
    if (!p.usaProduccionPorciones && (await kardexCubreStockMenu(tx, p.idProducto, tenantId))) {
        return;
    }
    await tx.producto.update({
        where: { idProducto: p.idProducto },
        data: { stockDisponible: { increment: cantidad } },
    });
}
async function leerStockMenuControladoTx(tx, p) {
    if (!p.controlStock || p.usaProduccionPorciones)
        return null;
    const row = await tx.producto.findUnique({
        where: { idProducto: p.idProducto },
        select: { stockDisponible: true },
    });
    return row?.stockDisponible ?? null;
}
async function cerrarStockMenuSiNoMovioTx(tx, p, deltaUnidades, stockAntes) {
    if (!p.controlStock || p.usaProduccionPorciones || deltaUnidades === 0)
        return;
    const row = await tx.producto.findUnique({
        where: { idProducto: p.idProducto },
        select: { stockDisponible: true },
    });
    if (!row)
        return;
    const ya = row.stockDisponible - stockAntes;
    if (ya === deltaUnidades || ya !== 0)
        return;
    await tx.producto.update({
        where: { idProducto: p.idProducto },
        data: { stockDisponible: { increment: deltaUnidades } },
    });
}
async function ajustarStockBebidaTx(tx, p, deltaCantidad) {
    if (deltaCantidad > 0) {
        await descontarStockBebidaTx(tx, p, deltaCantidad);
    }
    else if (deltaCantidad < 0) {
        await reintegrarStockBebidaTx(tx, p, -deltaCantidad);
    }
}
//# sourceMappingURL=stock-bebida.js.map