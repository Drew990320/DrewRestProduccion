"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reintegrarStockRetailTx = reintegrarStockRetailTx;
exports.descontarStockRetailTx = descontarStockRetailTx;
const common_1 = require("@nestjs/common");
function esRetail(det) {
    return det.producto.categoria.canal === 'retail';
}
async function reintegrarStockRetailTx(tx, det, cantidad = det.cantidad) {
    if (!esRetail(det) || cantidad <= 0)
        return;
    if (det.idProductoVariante != null) {
        await tx.productoVariante.update({
            where: { idVariante: det.idProductoVariante },
            data: { stockDisponible: { increment: cantidad } },
        });
        return;
    }
    if (det.producto.controlStock) {
        await tx.producto.update({
            where: { idProducto: det.idProducto },
            data: { stockDisponible: { increment: cantidad } },
        });
    }
}
async function descontarStockRetailTx(tx, det, cantidad) {
    if (!esRetail(det) || cantidad <= 0)
        return;
    if (det.idProductoVariante != null) {
        if (!det.producto.controlStock)
            return;
        const dec = await tx.productoVariante.updateMany({
            where: {
                idVariante: det.idProductoVariante,
                stockDisponible: { gte: cantidad },
            },
            data: { stockDisponible: { decrement: cantidad } },
        });
        if (dec.count === 0) {
            throw new common_1.BadRequestException('Stock insuficiente de la variante');
        }
        return;
    }
    if (det.producto.controlStock) {
        const dec = await tx.producto.updateMany({
            where: {
                idProducto: det.idProducto,
                stockDisponible: { gte: cantidad },
            },
            data: { stockDisponible: { decrement: cantidad } },
        });
        if (dec.count === 0) {
            throw new common_1.BadRequestException('Stock insuficiente');
        }
    }
}
//# sourceMappingURL=stock-retail.js.map