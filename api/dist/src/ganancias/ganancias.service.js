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
exports.GananciasService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const ganancias_periodo_1 = require("@drewrest/shared-domain/ganancias-periodo");
const resumen_periodo_1 = require("@drewrest/shared-domain/resumen-periodo");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const ganancias_pdf_1 = require("./ganancias-pdf");
let GananciasService = class GananciasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseFechaYmd(raw, label) {
        const dt = luxon_1.DateTime.fromISO(raw.trim(), { zone: 'America/Bogota' });
        if (!dt.isValid) {
            throw new common_1.BadRequestException(`${label} inválida (YYYY-MM-DD)`);
        }
        return dt.startOf('day');
    }
    resolverRango(opts) {
        const periodo = (0, resumen_periodo_1.parsePeriodoResumen)(opts.periodo);
        let base = luxon_1.DateTime.now().setZone('America/Bogota');
        if (opts.fecha?.trim()) {
            base = this.parseFechaYmd(opts.fecha, 'fecha');
        }
        const ancla = base.toFormat('yyyy-LL-dd');
        let rango;
        if (periodo === 'personalizado') {
            const desde = (opts.fecha_desde ?? '').trim() || ancla;
            const hasta = (opts.fecha_hasta ?? '').trim() || desde;
            const custom = (0, resumen_periodo_1.rangoPeriodoPersonalizado)(desde, hasta);
            if (!custom) {
                throw new common_1.BadRequestException('Rango personalizado inválido: fecha_desde ≤ fecha_hasta y máximo 366 días');
            }
            rango = custom;
        }
        else {
            rango = (0, resumen_periodo_1.rangoPeriodoResumen)(periodo, ancla);
        }
        const startDt = luxon_1.DateTime.fromISO(rango.fecha_desde, {
            zone: 'America/Bogota',
        }).startOf('day');
        const endDt = luxon_1.DateTime.fromISO(rango.fecha_hasta, {
            zone: 'America/Bogota',
        })
            .endOf('day')
            .plus({ millisecond: 1 });
        if (!startDt.isValid || !endDt.isValid) {
            throw new common_1.BadRequestException('No se pudo calcular el rango del periodo');
        }
        return {
            periodo: rango.periodo,
            etiqueta: rango.etiqueta,
            fecha_ancla: rango.fecha_ancla,
            fecha_desde: rango.fecha_desde,
            fecha_hasta: rango.fecha_hasta,
            start: startDt.toJSDate(),
            end: endDt.toJSDate(),
            startDateOnly: startDt.toJSDate(),
            endDateOnly: luxon_1.DateTime.fromISO(rango.fecha_hasta, {
                zone: 'America/Bogota',
            })
                .startOf('day')
                .toJSDate(),
        };
    }
    async listarProductosCostos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const productos = await this.prisma.producto.findMany({
            where: {
                activo: true,
                esAcompanamientoMazorca: false,
                esCuotaPendienteReparto: false,
                categoria: { idRestaurante: tenantId },
            },
            include: {
                categoria: { select: { nombre: true } },
                receta: { select: { costoCalculado: true, activa: true } },
            },
            orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
        });
        return productos.map((p) => {
            const precio = Math.round(Number(p.precio));
            const precioCosto = p.precioCosto != null ? Math.round(Number(p.precioCosto)) : null;
            const costoReceta = p.receta?.activa && p.receta.costoCalculado != null
                ? Math.round(Number(p.receta.costoCalculado))
                : null;
            const ef = (0, ganancias_periodo_1.costoEfectivoProducto)(precioCosto, costoReceta);
            const ganancia = precio - ef.costo;
            const margen_pct = precio > 0 ? Math.round((ganancia / precio) * 10_000) / 100 : null;
            return {
                id_producto: p.idProducto,
                nombre: p.nombre,
                categoria: p.categoria.nombre,
                precio_venta: precio,
                precio_costo: precioCosto,
                costo_receta: costoReceta,
                costo_efectivo: ef.costo,
                origen_costo: ef.origen,
                ganancia_unitaria: ganancia,
                margen_pct,
            };
        });
    }
    async actualizarProductoCosto(idProducto, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const p = await this.prisma.producto.findFirst({
            where: {
                idProducto,
                categoria: { idRestaurante: tenantId },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado');
        const precioCosto = dto.precio_costo === undefined
            ? undefined
            : dto.precio_costo === null
                ? null
                : Math.round(Number(dto.precio_costo));
        await this.prisma.producto.update({
            where: { idProducto },
            data: {
                ...(precioCosto !== undefined ? { precioCosto } : {}),
            },
        });
        const rows = await this.listarProductosCostos(tenantId);
        return rows.find((r) => r.id_producto === idProducto);
    }
    async listarGastosFijos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.gastoFijoGanancia.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        });
        return rows.map((r) => ({
            id_gasto_fijo: r.idGastoFijo,
            nombre: r.nombre,
            monto_mensual: Math.round(Number(r.montoMensual)),
            activo: r.activo,
            notas: r.notas,
        }));
    }
    async crearGastoFijo(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.gastoFijoGanancia.create({
            data: {
                idRestaurante: tenantId,
                nombre: dto.nombre.trim(),
                montoMensual: Math.round(dto.monto_mensual),
                activo: dto.activo !== false,
                notas: dto.notas?.trim() || null,
            },
        });
        return {
            id_gasto_fijo: row.idGastoFijo,
            nombre: row.nombre,
            monto_mensual: Math.round(Number(row.montoMensual)),
            activo: row.activo,
            notas: row.notas,
        };
    }
    async actualizarGastoFijo(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        const row = await this.prisma.gastoFijoGanancia.update({
            where: { idGastoFijo: id },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.monto_mensual != null
                    ? { montoMensual: Math.round(dto.monto_mensual) }
                    : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
                ...(dto.notas !== undefined
                    ? { notas: dto.notas?.trim() || null }
                    : {}),
            },
        });
        return {
            id_gasto_fijo: row.idGastoFijo,
            nombre: row.nombre,
            monto_mensual: Math.round(Number(row.montoMensual)),
            activo: row.activo,
            notas: row.notas,
        };
    }
    async eliminarGastoFijo(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        await this.prisma.gastoFijoGanancia.delete({ where: { idGastoFijo: id } });
        return { ok: true };
    }
    async listarGastosExtras(opts, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rango = this.resolverRango({
            periodo: 'personalizado',
            fecha_desde: opts.fecha_desde,
            fecha_hasta: opts.fecha_hasta ?? opts.fecha_desde,
        });
        const rows = await this.prisma.gastoExtraGanancia.findMany({
            where: {
                idRestaurante: tenantId,
                fecha: { gte: rango.startDateOnly, lte: rango.endDateOnly },
            },
            orderBy: [{ fecha: 'desc' }, { idGastoExtra: 'desc' }],
        });
        return rows.map((r) => ({
            id_gasto_extra: r.idGastoExtra,
            nombre: r.nombre,
            monto: Math.round(Number(r.monto)),
            fecha: luxon_1.DateTime.fromJSDate(r.fecha).toUTC().toFormat('yyyy-LL-dd'),
            notas: r.notas,
        }));
    }
    async crearGastoExtra(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const fecha = this.parseFechaYmd(dto.fecha, 'fecha');
        const row = await this.prisma.gastoExtraGanancia.create({
            data: {
                idRestaurante: tenantId,
                nombre: dto.nombre.trim(),
                monto: Math.round(dto.monto),
                fecha: fecha.toJSDate(),
                notas: dto.notas?.trim() || null,
            },
        });
        return {
            id_gasto_extra: row.idGastoExtra,
            nombre: row.nombre,
            monto: Math.round(Number(row.monto)),
            fecha: fecha.toFormat('yyyy-LL-dd'),
            notas: row.notas,
        };
    }
    async actualizarGastoExtra(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.gastoExtraGanancia.findFirst({
            where: { idGastoExtra: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto extra no encontrado');
        const fecha = dto.fecha
            ? this.parseFechaYmd(dto.fecha, 'fecha').toJSDate()
            : undefined;
        const row = await this.prisma.gastoExtraGanancia.update({
            where: { idGastoExtra: id },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.monto != null ? { monto: Math.round(dto.monto) } : {}),
                ...(fecha ? { fecha } : {}),
                ...(dto.notas !== undefined
                    ? { notas: dto.notas?.trim() || null }
                    : {}),
            },
        });
        return {
            id_gasto_extra: row.idGastoExtra,
            nombre: row.nombre,
            monto: Math.round(Number(row.monto)),
            fecha: luxon_1.DateTime.fromJSDate(row.fecha).toUTC().toFormat('yyyy-LL-dd'),
            notas: row.notas,
        };
    }
    async eliminarGastoExtra(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.gastoExtraGanancia.findFirst({
            where: { idGastoExtra: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto extra no encontrado');
        await this.prisma.gastoExtraGanancia.delete({ where: { idGastoExtra: id } });
        return { ok: true };
    }
    async reporte(opts, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rango = this.resolverRango(opts);
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { nombreComercial: true },
        });
        const facturas = await this.prisma.factura.findMany({
            where: {
                emitidaEn: { gte: rango.start, lt: rango.end },
                pedido: { idRestaurante: tenantId },
            },
            select: {
                idFactura: true,
                total: true,
                detalles: {
                    where: {
                        idDetalleComboPadre: null,
                        producto: {
                            esAcompanamientoMazorca: false,
                            esCuotaPendienteReparto: false,
                        },
                    },
                    select: {
                        cantidad: true,
                        precioUnitario: true,
                        idProducto: true,
                        producto: {
                            select: {
                                nombre: true,
                                precioCosto: true,
                                receta: { select: { costoCalculado: true, activa: true } },
                            },
                        },
                    },
                },
            },
        });
        const ventas = facturas.reduce((s, f) => s + Math.round(Number(f.total)), 0);
        const lineasRaw = [];
        for (const f of facturas) {
            for (const d of f.detalles) {
                const precioUnit = Math.round(Number(d.precioUnitario));
                const precioCosto = d.producto.precioCosto != null
                    ? Math.round(Number(d.producto.precioCosto))
                    : null;
                const costoReceta = d.producto.receta?.activa && d.producto.receta.costoCalculado != null
                    ? Math.round(Number(d.producto.receta.costoCalculado))
                    : null;
                const ef = (0, ganancias_periodo_1.costoEfectivoProducto)(precioCosto, costoReceta);
                const cantidad = Math.max(0, d.cantidad);
                const venta_total = cantidad * precioUnit;
                const costo_total = cantidad * ef.costo;
                lineasRaw.push({
                    id_producto: d.idProducto,
                    nombre: d.producto.nombre,
                    cantidad,
                    precio_venta_unitario: precioUnit,
                    costo_unitario: ef.costo,
                    origen_costo: ef.origen,
                    venta_total,
                    costo_total,
                    ganancia: venta_total - costo_total,
                });
            }
        }
        const por_producto = (0, ganancias_periodo_1.consolidarLineasCostoVenta)(lineasRaw);
        const fijos = await this.prisma.gastoFijoGanancia.findMany({
            where: { idRestaurante: tenantId, activo: true },
        });
        const fijosProrrateo = (0, ganancias_periodo_1.prorratearGastosFijos)(fijos.map((g) => ({
            id: g.idGastoFijo,
            nombre: g.nombre,
            monto_mensual: Number(g.montoMensual),
        })), rango.fecha_desde, rango.fecha_hasta);
        const extras = await this.prisma.gastoExtraGanancia.findMany({
            where: {
                idRestaurante: tenantId,
                fecha: { gte: rango.startDateOnly, lte: rango.endDateOnly },
            },
            orderBy: [{ fecha: 'asc' }, { idGastoExtra: 'asc' }],
        });
        const gastos_extras_detalle = extras.map((e) => ({
            id_gasto_extra: e.idGastoExtra,
            nombre: e.nombre,
            monto: Math.round(Number(e.monto)),
            fecha: luxon_1.DateTime.fromJSDate(e.fecha).toUTC().toFormat('yyyy-LL-dd'),
            notas: e.notas,
        }));
        const gastos_extras = gastos_extras_detalle.reduce((s, e) => s + e.monto, 0);
        const fechaDesdeDb = luxon_1.DateTime.fromISO(rango.fecha_desde, {
            zone: 'America/Bogota',
        });
        const fechaHastaDb = luxon_1.DateTime.fromISO(rango.fecha_hasta, {
            zone: 'America/Bogota',
        });
        const pagosMeseroRows = await this.prisma.registroBeneficioMesero.findMany({
            where: {
                fecha: {
                    gte: new Date(Date.UTC(fechaDesdeDb.year, fechaDesdeDb.month - 1, fechaDesdeDb.day)),
                    lte: new Date(Date.UTC(fechaHastaDb.year, fechaHastaDb.month - 1, fechaHastaDb.day)),
                },
                tipo: 'pago_turno',
                monto: { not: null },
                mesero: { idRestaurante: tenantId },
            },
            include: {
                mesero: { select: { nombre: true, apellido: true } },
            },
            orderBy: [{ fecha: 'asc' }, { idRegistro: 'asc' }],
        });
        const pagos_meseros = pagosMeseroRows.map((r) => ({
            id_registro: r.idRegistro,
            id_usuario: r.idUsuario,
            mesero: `${r.mesero.nombre} ${r.mesero.apellido}`.trim(),
            monto: Math.round(Number(r.monto ?? 0)),
            fecha: luxon_1.DateTime.fromJSDate(r.fecha).toUTC().toFormat('yyyy-LL-dd'),
        }));
        const gastos_meseros = pagos_meseros.reduce((s, p) => s + p.monto, 0);
        const resumen = (0, ganancias_periodo_1.armarResumenGanancias)({
            ventas,
            lineas: por_producto,
            gastos_fijos: fijosProrrateo.total,
            gastos_extras,
            gastos_meseros,
        });
        return {
            restaurante: cfg?.nombreComercial ?? 'Restaurante',
            periodo: rango.periodo,
            periodo_etiqueta: rango.etiqueta,
            fecha_ancla: rango.fecha_ancla,
            fecha_desde: rango.fecha_desde,
            fecha_hasta: rango.fecha_hasta,
            resumen,
            por_producto,
            gastos_fijos: fijosProrrateo.detalle,
            gastos_extras: gastos_extras_detalle,
            pagos_meseros,
            facturas_count: facturas.length,
        };
    }
    async reportePdf(opts, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const data = await this.reporte(opts, tenantId);
        return (0, ganancias_pdf_1.buildGananciasPdf)(data);
    }
};
exports.GananciasService = GananciasService;
exports.GananciasService = GananciasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GananciasService);
//# sourceMappingURL=ganancias.service.js.map