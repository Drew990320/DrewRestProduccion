"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const contabilidad_posting_service_1 = require("../contabilidad/contabilidad-posting.service");
const cliente_credito_1 = require("./cliente-credito");
const INCLUDE_CUENTA = {
    pedido: { include: { mesa: { select: { numero: true } } } },
};
const n = (v) => Math.round(Number(v ?? 0));
let CreditosService = class CreditosService {
    prisma;
    contabilidadPosting;
    constructor(prisma, contabilidadPosting) {
        this.prisma = prisma;
        this.contabilidadPosting = contabilidadPosting;
    }
    mapCuenta(row) {
        return {
            id_credito: row.idCredito,
            id_pedido: row.idPedido,
            id_factura: row.idFactura,
            id_cliente: row.idCliente,
            mesa_numero: row.pedido?.mesa?.numero ?? null,
            nombre_cliente: row.nombreCliente,
            telefono: row.telefono,
            monto_total: n(row.montoTotal),
            saldo_pendiente: n(row.saldoPendiente),
            notas: row.notas,
            estado: row.estado,
            creado_en: row.creadoEn.toISOString(),
            pagado_en: row.pagadoEn?.toISOString() ?? null,
            id_usuario: row.idUsuario,
        };
    }
    mapCuentaConAbonos(row) {
        return {
            ...this.mapCuenta(row),
            abonos: row.abonos
                .slice()
                .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime())
                .map((a) => ({
                id_abono: a.idAbono,
                monto: n(a.monto),
                notas: a.notas,
                creado_en: a.creadoEn.toISOString(),
            })),
        };
    }
    async listar(soloAbiertos = true, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.cuentaCredito.findMany({
            where: {
                ...(soloAbiertos ? { estado: 'abierto' } : {}),
                pedido: { idRestaurante: tenantId },
            },
            orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
            include: INCLUDE_CUENTA,
        });
        return rows.map((r) => this.mapCuenta(r));
    }
    async crear(dto, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const monto = Math.round(dto.monto_total);
        if (monto <= 0) {
            throw new common_1.BadRequestException('El monto debe ser mayor que cero');
        }
        const pedido = await this.prisma.pedido.findFirst({
            where: { idPedido: dto.id_pedido, idRestaurante: tenantId },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (dto.id_factura != null) {
            const factura = await this.prisma.factura.findFirst({
                where: { idFactura: dto.id_factura, idPedido: dto.id_pedido },
            });
            if (!factura) {
                throw new common_1.BadRequestException('Factura no pertenece al pedido');
            }
        }
        const row = await this.prisma.$transaction(async (tx) => {
            const cliente = await (0, cliente_credito_1.resolverClienteFiado)(tx, tenantId, {
                idCliente: dto.id_cliente,
                nombre: dto.nombre_cliente,
                telefono: dto.telefono,
                monto,
            });
            return tx.cuentaCredito.create({
                data: {
                    idPedido: dto.id_pedido,
                    idFactura: dto.id_factura ?? null,
                    idCliente: cliente.idCliente,
                    nombreCliente: cliente.nombre,
                    telefono: cliente.telefono,
                    montoTotal: monto,
                    saldoPendiente: monto,
                    notas: dto.notas?.trim() || null,
                    idUsuario,
                },
                include: INCLUDE_CUENTA,
            });
        });
        return this.mapCuenta(row);
    }
    async aplicarAbonoEnTx(tx, cuenta, abono, notas, tenantId, idUsuario) {
        const nuevoSaldo = n(cuenta.saldoPendiente) - abono;
        await tx.abonoCredito.create({
            data: {
                idCredito: cuenta.idCredito,
                monto: abono,
                notas,
                idUsuario,
            },
        });
        const updated = await tx.cuentaCredito.update({
            where: { idCredito: cuenta.idCredito },
            data: nuevoSaldo <= 0
                ? { estado: 'pagado', pagadoEn: new Date(), saldoPendiente: 0 }
                : { saldoPendiente: nuevoSaldo },
            include: INCLUDE_CUENTA,
        });
        try {
            await this.contabilidadPosting.postEvento(tx, {
                tenantId,
                evento: 'abono_cliente',
                monto: abono,
                fecha: new Date(),
                origen: { modulo: 'creditos', tipo: 'abono', id: cuenta.idCredito },
                idDocumento: `credito:${cuenta.idCredito}:abono:${abono}:${Date.now()}`,
                idUsuario: idUsuario ?? cuenta.idUsuario,
                descripcion: `Abono crédito #${cuenta.idCredito}`,
            });
        }
        catch {
        }
        return updated;
    }
    async registrarAbono(idCredito, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario = null) {
        const cuenta = await this.prisma.cuentaCredito.findFirst({
            where: { idCredito, pedido: { idRestaurante: tenantId } },
        });
        if (!cuenta) {
            throw new common_1.NotFoundException('Cuenta de crédito no encontrada');
        }
        if (cuenta.estado === 'pagado') {
            throw new common_1.BadRequestException('La cuenta ya está saldada');
        }
        const abono = Math.round(dto.monto);
        if (abono <= 0) {
            throw new common_1.BadRequestException('El abono debe ser mayor que cero');
        }
        if (abono > n(cuenta.saldoPendiente)) {
            throw new common_1.BadRequestException('El abono supera el saldo pendiente');
        }
        const row = await this.prisma.$transaction((tx) => this.aplicarAbonoEnTx(tx, cuenta, abono, dto.notas?.trim() || null, tenantId, idUsuario));
        return this.mapCuenta(row);
    }
    async listarClientes(q, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const texto = q?.trim();
        const clientes = await this.prisma.clienteCredito.findMany({
            where: {
                idRestaurante: tenantId,
                ...(texto
                    ? {
                        OR: [
                            { nombre: { contains: texto, mode: 'insensitive' } },
                            { telefono: { contains: texto } },
                            { documento: { contains: texto } },
                        ],
                    }
                    : {}),
            },
            include: {
                cuentas: {
                    select: { estado: true, saldoPendiente: true, montoTotal: true, creadoEn: true },
                },
            },
        });
        return clientes
            .map((c) => {
            const abiertas = c.cuentas.filter((x) => x.estado === 'abierto');
            const deuda = abiertas.reduce((s, x) => s + n(x.saldoPendiente), 0);
            const limite = c.limiteCredito != null ? n(c.limiteCredito) : null;
            const ultimo = c.cuentas.reduce((m, x) => (!m || x.creadoEn > m ? x.creadoEn : m), null);
            const masAntiguo = abiertas.reduce((m, x) => (!m || x.creadoEn < m ? x.creadoEn : m), null);
            return {
                id_cliente: c.idCliente,
                nombre: c.nombre,
                telefono: c.telefono,
                documento: c.documento,
                notas: c.notas,
                linea_credito_activa: c.lineaCreditoActiva,
                limite_credito: limite,
                activo: c.activo,
                deuda,
                disponible: c.lineaCreditoActiva && limite != null ? Math.max(0, limite - deuda) : null,
                creditos_abiertos: abiertas.length,
                creditos_total: c.cuentas.length,
                total_historico: c.cuentas.reduce((s, x) => s + n(x.montoTotal), 0),
                ultimo_fiado_en: ultimo?.toISOString() ?? null,
                deuda_desde: masAntiguo?.toISOString() ?? null,
                creado_en: c.creadoEn.toISOString(),
            };
        })
            .sort((a, b) => b.deuda - a.deuda || a.nombre.localeCompare(b.nombre, 'es'));
    }
    async detalleCliente(idCliente, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const [resumen] = (await this.listarClientes(undefined, tenantId)).filter((c) => c.id_cliente === idCliente);
        if (!resumen)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const cuentas = await this.prisma.cuentaCredito.findMany({
            where: { idCliente, pedido: { idRestaurante: tenantId } },
            orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
            include: { ...INCLUDE_CUENTA, abonos: true },
        });
        return { ...resumen, cuentas: cuentas.map((c) => this.mapCuentaConAbonos(c)) };
    }
    async validarNombreUnico(tenantId, nombre, telefono, excluirId) {
        const dup = await this.prisma.clienteCredito.findFirst({
            where: {
                idRestaurante: tenantId,
                ...(excluirId ? { idCliente: { not: excluirId } } : {}),
                OR: [
                    { nombre: { equals: nombre, mode: 'insensitive' } },
                    ...(telefono ? [{ telefono }] : []),
                ],
            },
        });
        if (dup) {
            throw new common_1.BadRequestException(`Ya existe un cliente con ese ${dup.telefono && dup.telefono === telefono ? 'teléfono' : 'nombre'}: ${dup.nombre}`);
        }
    }
    async crearCliente(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const nombre = dto.nombre.trim();
        const telefono = dto.telefono?.trim() || null;
        await this.validarNombreUnico(tenantId, nombre, telefono);
        const row = await this.prisma.clienteCredito.create({
            data: {
                idRestaurante: tenantId,
                nombre,
                telefono,
                documento: dto.documento?.trim() || null,
                notas: dto.notas?.trim() || null,
                lineaCreditoActiva: dto.linea_credito_activa ?? false,
                limiteCredito: dto.limite_credito ?? null,
                activo: dto.activo ?? true,
            },
        });
        return this.detalleCliente(row.idCliente, tenantId);
    }
    async actualizarCliente(idCliente, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const actual = await this.prisma.clienteCredito.findFirst({
            where: { idCliente, idRestaurante: tenantId },
        });
        if (!actual)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const nombre = dto.nombre?.trim() ?? actual.nombre;
        const telefono = dto.telefono !== undefined ? dto.telefono.trim() || null : actual.telefono;
        if (nombre !== actual.nombre || telefono !== actual.telefono) {
            await this.validarNombreUnico(tenantId, nombre, telefono, idCliente);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.clienteCredito.update({
                where: { idCliente },
                data: {
                    nombre,
                    telefono,
                    ...(dto.documento !== undefined
                        ? { documento: dto.documento.trim() || null }
                        : {}),
                    ...(dto.notas !== undefined ? { notas: dto.notas.trim() || null } : {}),
                    ...(dto.linea_credito_activa !== undefined
                        ? { lineaCreditoActiva: dto.linea_credito_activa }
                        : {}),
                    ...(dto.limite_credito !== undefined ? { limiteCredito: dto.limite_credito } : {}),
                    ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
                },
            });
            if (nombre !== actual.nombre || telefono !== actual.telefono) {
                await tx.cuentaCredito.updateMany({
                    where: { idCliente },
                    data: { nombreCliente: nombre, telefono },
                });
            }
        });
        return this.detalleCliente(idCliente, tenantId);
    }
    async abonarCliente(idCliente, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario = null) {
        const monto = Math.round(dto.monto);
        if (monto <= 0)
            throw new common_1.BadRequestException('El abono debe ser mayor que cero');
        const cuentas = await this.prisma.cuentaCredito.findMany({
            where: { idCliente, estado: 'abierto', pedido: { idRestaurante: tenantId } },
            orderBy: { creadoEn: 'asc' },
        });
        if (cuentas.length === 0) {
            throw new common_1.BadRequestException('El cliente no tiene saldo pendiente');
        }
        const deuda = cuentas.reduce((s, c) => s + n(c.saldoPendiente), 0);
        if (monto > deuda) {
            throw new common_1.BadRequestException('El abono supera la deuda del cliente');
        }
        const notas = dto.notas?.trim() || null;
        await this.prisma.$transaction(async (tx) => {
            let restante = monto;
            for (const c of cuentas) {
                if (restante <= 0)
                    break;
                const parte = Math.min(restante, n(c.saldoPendiente));
                if (parte <= 0)
                    continue;
                await this.aplicarAbonoEnTx(tx, c, parte, notas, tenantId, idUsuario);
                restante -= parte;
            }
        });
        return this.detalleCliente(idCliente, tenantId);
    }
};
exports.CreditosService = CreditosService;
exports.CreditosService = CreditosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        contabilidad_posting_service_1.ContabilidadPostingService])
], CreditosService);
//# sourceMappingURL=creditos.service.js.map