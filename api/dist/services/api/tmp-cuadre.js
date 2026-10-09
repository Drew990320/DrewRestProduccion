"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const recurso_movimientos_1 = require("../../packages/shared-domain/src/recurso-movimientos");
(async () => {
    const p = new client_1.PrismaClient();
    const recursos = await p.recurso.findMany({
        select: { idRecurso: true, nombre: true, unidad: true, stock: true, estado: true, idProducto: true, idInventarioLegacy: true },
    });
    const movs = await p.movimientoRecurso.findMany({ select: { idRecurso: true, tipo: true, cantidad: true } });
    const suma = new Map();
    for (const m of movs) {
        suma.set(m.idRecurso, (suma.get(m.idRecurso) ?? 0) + (0, recurso_movimientos_1.deltaStockMovimientoRecurso)(m.tipo, Number(m.cantidad)));
    }
    console.table(recursos.map((r) => ({
        id: r.idRecurso,
        nombre: r.nombre,
        unidad: r.unidad,
        estado: r.estado,
        stock: Number(r.stock),
        kardex: Math.round((suma.get(r.idRecurso) ?? 0) * 1000) / 1000,
        cuadra: Math.abs(Number(r.stock) - (suma.get(r.idRecurso) ?? 0)) < 0.001 ? 'si' : 'NO',
        producto: r.idProducto,
        legacy: r.idInventarioLegacy,
    })));
    const prods = await p.producto.findMany({
        where: { controlStock: true },
        select: { idProducto: true, nombre: true, stockDisponible: true },
    });
    console.log('\nProductos de menú con control de stock:');
    console.table(prods);
    await p.$disconnect();
})();
//# sourceMappingURL=tmp-cuadre.js.map