"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limpiarReglasImpresionPorProducto = limpiarReglasImpresionPorProducto;
exports.limpiarReglasImpresionPorCategoria = limpiarReglasImpresionPorCategoria;
exports.purgarReglasImpresionMenuInactivo = purgarReglasImpresionMenuInactivo;
const destinos_impresora_cache_1 = require("./destinos-impresora-cache");
async function limpiarReglasImpresionPorProducto(prisma, idProducto, tenantId) {
    const res = await prisma.reglaImpresionCocina.deleteMany({
        where: { idProducto },
    });
    if (res.count > 0) {
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
    }
    return res.count;
}
async function limpiarReglasImpresionPorCategoria(prisma, idCategoria, tenantId) {
    const productos = await prisma.producto.findMany({
        where: { idCategoria },
        select: { idProducto: true },
    });
    const idsProducto = productos.map((p) => p.idProducto);
    const res = await prisma.reglaImpresionCocina.deleteMany({
        where: {
            OR: [
                { idCategoria },
                ...(idsProducto.length > 0
                    ? [{ idProducto: { in: idsProducto } }]
                    : []),
            ],
        },
    });
    if (res.count > 0) {
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
    }
    return res.count;
}
async function purgarReglasImpresionMenuInactivo(prisma, tenantId) {
    const res = await prisma.reglaImpresionCocina.deleteMany({
        where: {
            impresora: { idRestaurante: tenantId },
            OR: [
                { alcance: 'categoria', categoria: { activo: false } },
                { alcance: 'producto', producto: { activo: false } },
                {
                    alcance: 'producto',
                    producto: { categoria: { activo: false } },
                },
            ],
        },
    });
    if (res.count > 0) {
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
    }
    return res.count;
}
//# sourceMappingURL=limpiar-reglas-impresion-cocina.js.map