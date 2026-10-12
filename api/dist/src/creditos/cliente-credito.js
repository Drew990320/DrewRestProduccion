"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deudaAbiertaCliente = deudaAbiertaCliente;
exports.resolverClienteFiado = resolverClienteFiado;
const common_1 = require("@nestjs/common");
function formatCop(n) {
    return `$${Math.round(n).toLocaleString('es-CO')}`;
}
async function deudaAbiertaCliente(tx, idCliente) {
    const agg = await tx.cuentaCredito.aggregate({
        where: { idCliente, estado: 'abierto' },
        _sum: { saldoPendiente: true },
    });
    return Math.round(Number(agg._sum.saldoPendiente ?? 0));
}
async function resolverClienteFiado(tx, tenantId, input) {
    const nombre = input.nombre.trim();
    const telefono = input.telefono?.trim() || null;
    let cliente = input.idCliente != null
        ? await tx.clienteCredito.findFirst({
            where: { idCliente: input.idCliente, idRestaurante: tenantId },
        })
        : null;
    if (input.idCliente != null && !cliente) {
        throw new common_1.NotFoundException('Cliente de crédito no encontrado');
    }
    if (!cliente && telefono) {
        cliente = await tx.clienteCredito.findFirst({
            where: { idRestaurante: tenantId, telefono },
            orderBy: { idCliente: 'asc' },
        });
    }
    if (!cliente && nombre) {
        cliente = await tx.clienteCredito.findFirst({
            where: { idRestaurante: tenantId, nombre: { equals: nombre, mode: 'insensitive' } },
            orderBy: { idCliente: 'asc' },
        });
    }
    if (!cliente) {
        cliente = await tx.clienteCredito.create({
            data: { idRestaurante: tenantId, nombre, telefono },
        });
    }
    else if (!cliente.telefono && telefono) {
        cliente = await tx.clienteCredito.update({
            where: { idCliente: cliente.idCliente },
            data: { telefono },
        });
    }
    if (!cliente.activo) {
        throw new common_1.BadRequestException(`${cliente.nombre} está bloqueado para créditos. Un administrador puede reactivarlo en Créditos.`);
    }
    if (cliente.lineaCreditoActiva && cliente.limiteCredito != null) {
        const limite = Math.round(Number(cliente.limiteCredito));
        const deuda = await deudaAbiertaCliente(tx, cliente.idCliente);
        if (deuda + input.monto > limite) {
            const disponible = Math.max(0, limite - deuda);
            throw new common_1.BadRequestException(`El crédito supera el cupo de ${cliente.nombre}: debe ${formatCop(deuda)} de ${formatCop(limite)} (disponible ${formatCop(disponible)}).`);
        }
    }
    return { idCliente: cliente.idCliente, nombre: cliente.nombre, telefono: cliente.telefono };
}
//# sourceMappingURL=cliente-credito.js.map