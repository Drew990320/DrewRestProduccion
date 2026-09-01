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
var GananciasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GananciasService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const client_1 = require("@prisma/client");
const ganancias_periodo_1 = require("@drewrest/shared-domain/ganancias-periodo");
const resumen_periodo_1 = require("@drewrest/shared-domain/resumen-periodo");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const ganancias_pdf_1 = require("./ganancias-pdf");
let GananciasService = GananciasService_1 = class GananciasService {
    prisma;
    logger = new common_1.Logger(GananciasService_1.name);
    esquemaGananciasOk = false;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            await this.asegurarEsquemaGanancias();
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Init esquema ganancias: ${msg}`);
        }
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
    hoyYmd() {
        return luxon_1.DateTime.now().setZone('America/Bogota').toFormat('yyyy-LL-dd');
    }
    fechaOnlyFromYmd(ymd, label = 'fecha') {
        const dt = this.parseFechaYmd(ymd, label);
        return new Date(Date.UTC(dt.year, dt.month - 1, dt.day));
    }
    resolverFechaCuota(fecha) {
        const ymd = fecha?.trim() || this.hoyYmd();
        return { ymd, fechaOnly: this.fechaOnlyFromYmd(ymd) };
    }
    resolverRangoCuotas(fechaDesde, fechaHasta) {
        const desde = fechaDesde?.trim() || this.hoyYmd();
        const hasta = fechaHasta?.trim() || desde;
        const dias = (0, ganancias_periodo_1.ymdInclusiveList)(desde, hasta);
        if (!dias.length) {
            throw new common_1.BadRequestException('Rango de fechas inválido (YYYY-MM-DD)');
        }
        if (dias.length > 366) {
            throw new common_1.BadRequestException('El rango no puede superar 366 días');
        }
        return {
            fecha_desde: dias[0],
            fecha_hasta: dias[dias.length - 1],
            dias,
        };
    }
    mapPagoFondo(p) {
        return {
            id_pago_fondo: p.idPagoFondo,
            fecha: luxon_1.DateTime.fromJSDate(p.fecha).toUTC().toFormat('yyyy-LL-dd'),
            monto: Math.round(Number(p.monto)),
            notas: p.notas,
        };
    }
    mapGastoFijo(r, opts = {}) {
        const acumulado_mes = opts.acumulado_mes ?? 0;
        const acumulado_fondo = opts.acumulado_fondo ?? acumulado_mes;
        const pagado_fondo = opts.pagado_fondo ?? 0;
        const pagado_fondo_mes = opts.pagado_fondo_mes ?? 0;
        return {
            id_gasto_fijo: r.idGastoFijo,
            nombre: r.nombre,
            monto_mensual: Math.round(Number(r.montoMensual)),
            activo: r.activo,
            notas: r.notas,
            usa_fondo_diario: r.usaFondoDiario,
            cuota_diaria: r.cuotaDiaria != null ? Math.round(Number(r.cuotaDiaria)) : null,
            modo_registro_fondo: r.modoRegistroFondo,
            periodicidad: (0, ganancias_periodo_1.parsePeriodicidadGasto)(r.periodicidad, 'mensual'),
            acumulado_mes,
            acumulado_fondo,
            pagado_fondo,
            pagado_fondo_mes,
            disponible_fondo: (0, ganancias_periodo_1.disponibleFondo)(acumulado_fondo, pagado_fondo),
            pagos_fondo_mes: opts.pagos_fondo_mes ?? [],
        };
    }
    resolverFondoFields(dto, montoMensual, existing) {
        const usa = dto.usa_fondo_diario !== undefined
            ? dto.usa_fondo_diario
            : (existing?.usaFondoDiario ?? false);
        const modo = dto.modo_registro_fondo === 'confirmar' ||
            dto.modo_registro_fondo === 'automatico'
            ? dto.modo_registro_fondo
            : (existing?.modoRegistroFondo ?? 'automatico');
        let cuota = dto.cuota_diaria !== undefined
            ? dto.cuota_diaria == null
                ? null
                : Math.round(Number(dto.cuota_diaria) || 0)
            : existing?.cuotaDiaria != null
                ? Math.round(Number(existing.cuotaDiaria))
                : null;
        if (usa && (cuota == null || cuota <= 0)) {
            cuota = (0, ganancias_periodo_1.cuotaDiariaSugerida)(montoMensual);
        }
        if (usa && (cuota == null || cuota <= 0)) {
            throw new common_1.BadRequestException('La cuota diaria es obligatoria si el fondo está activo');
        }
        return {
            usaFondoDiario: usa,
            cuotaDiaria: cuota,
            modoRegistroFondo: modo,
        };
    }
    async acumuladosMes(tenantId, ymd) {
        const mes = (0, ganancias_periodo_1.rangoMesCalendario)(ymd);
        const out = new Map();
        if (!mes)
            return out;
        const rows = await this.prisma.cuotaFondoGastoFijo.findMany({
            where: {
                idRestaurante: tenantId,
                estado: 'aplicada',
                fecha: {
                    gte: this.fechaOnlyFromYmd(mes.desde),
                    lte: this.fechaOnlyFromYmd(mes.hasta),
                },
            },
        });
        for (const c of rows) {
            const id = c.idGastoFijo;
            out.set(id, (out.get(id) ?? 0) + Math.round(Number(c.monto)));
        }
        return out;
    }
    async saldosFondo(tenantId, ymd) {
        const mes = (0, ganancias_periodo_1.rangoMesCalendario)(ymd);
        const [cuotas, pagos] = await Promise.all([
            this.prisma.cuotaFondoGastoFijo.findMany({
                where: { idRestaurante: tenantId, estado: 'aplicada' },
            }),
            this.prisma.pagoFondoGastoFijo.findMany({
                where: { idRestaurante: tenantId },
                orderBy: [{ fecha: 'desc' }, { idPagoFondo: 'desc' }],
            }),
        ]);
        const acumulado = new Map();
        const acumuladoMes = new Map();
        const pagado = new Map();
        const pagadoMes = new Map();
        const pagosMes = new Map();
        for (const c of cuotas) {
            const id = c.idGastoFijo;
            const monto = Math.round(Number(c.monto));
            acumulado.set(id, (acumulado.get(id) ?? 0) + monto);
            const fecha = luxon_1.DateTime.fromJSDate(c.fecha).toUTC().toFormat('yyyy-LL-dd');
            if (mes && fecha >= mes.desde && fecha <= mes.hasta) {
                acumuladoMes.set(id, (acumuladoMes.get(id) ?? 0) + monto);
            }
        }
        for (const p of pagos) {
            const id = p.idGastoFijo;
            const monto = Math.round(Number(p.monto));
            pagado.set(id, (pagado.get(id) ?? 0) + monto);
            const mapped = this.mapPagoFondo(p);
            if (mes && mapped.fecha >= mes.desde && mapped.fecha <= mes.hasta) {
                pagadoMes.set(id, (pagadoMes.get(id) ?? 0) + monto);
                const list = pagosMes.get(id) ?? [];
                list.push(mapped);
                pagosMes.set(id, list);
            }
        }
        return { acumulado, acumuladoMes, pagado, pagadoMes, pagosMes };
    }
    columnasPeriodicidadOk = false;
    async asegurarEsquemaGanancias() {
        if (this.esquemaGananciasOk)
            return;
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "precio_costo" DECIMAL(12,2)`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "es_cuota_pendiente_reparto" BOOLEAN NOT NULL DEFAULT false`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "detalle_pedido" ADD COLUMN IF NOT EXISTS "id_detalle_combo_padre" INTEGER`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_ganancias_activo" BOOLEAN NOT NULL DEFAULT false`);
            await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "ModoRegistroFondoGanancia" AS ENUM ('automatico', 'confirmar');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
            await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "EstadoCuotaFondoGanancia" AS ENUM ('aplicada', 'omitida');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "gasto_fijo_ganancia" (
          "id_gasto_fijo" SERIAL NOT NULL,
          "id_restaurante" INTEGER NOT NULL DEFAULT 1,
          "nombre" VARCHAR(120) NOT NULL,
          "monto_mensual" DECIMAL(12,2) NOT NULL,
          "activo" BOOLEAN NOT NULL DEFAULT true,
          "notas" VARCHAR(500),
          "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "gasto_fijo_ganancia_pkey" PRIMARY KEY ("id_gasto_fijo")
        )
      `);
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "gasto_extra_ganancia" (
          "id_gasto_extra" SERIAL NOT NULL,
          "id_restaurante" INTEGER NOT NULL DEFAULT 1,
          "nombre" VARCHAR(120) NOT NULL,
          "monto" DECIMAL(12,2) NOT NULL,
          "fecha" DATE NOT NULL,
          "notas" VARCHAR(500),
          "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "gasto_extra_ganancia_pkey" PRIMARY KEY ("id_gasto_extra")
        )
      `);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "usa_fondo_diario" BOOLEAN NOT NULL DEFAULT false`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "cuota_diaria" DECIMAL(12,2)`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "modo_registro_fondo" "ModoRegistroFondoGanancia" NOT NULL DEFAULT 'automatico'`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "periodicidad" VARCHAR(16) NOT NULL DEFAULT 'mensual'`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_extra_ganancia" ADD COLUMN IF NOT EXISTS "usa_fondo" BOOLEAN NOT NULL DEFAULT false`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_extra_ganancia" ADD COLUMN IF NOT EXISTS "pagado_fondo" BOOLEAN NOT NULL DEFAULT true`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "gasto_extra_ganancia" ADD COLUMN IF NOT EXISTS "periodicidad" VARCHAR(16) NOT NULL DEFAULT 'diario'`);
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "cuota_fondo_gasto_fijo" (
          "id_cuota_fondo" SERIAL NOT NULL,
          "id_gasto_fijo" INTEGER NOT NULL,
          "id_restaurante" INTEGER NOT NULL DEFAULT 1,
          "fecha" DATE NOT NULL,
          "monto" DECIMAL(12,2) NOT NULL,
          "estado" "EstadoCuotaFondoGanancia" NOT NULL,
          "id_movimiento_caja" INTEGER,
          "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cuota_fondo_gasto_fijo_pkey" PRIMARY KEY ("id_cuota_fondo")
        )
      `);
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "pago_fondo_gasto_fijo" (
          "id_pago_fondo" SERIAL NOT NULL,
          "id_gasto_fijo" INTEGER NOT NULL,
          "id_restaurante" INTEGER NOT NULL DEFAULT 1,
          "fecha" DATE NOT NULL,
          "monto" DECIMAL(12,2) NOT NULL,
          "notas" VARCHAR(500),
          "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "pago_fondo_gasto_fijo_pkey" PRIMARY KEY ("id_pago_fondo")
        )
      `);
            await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gasto_fijo_ganancia_id_restaurante_activo_idx" ON "gasto_fijo_ganancia"("id_restaurante", "activo")`);
            await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "gasto_extra_ganancia_id_restaurante_fecha_idx" ON "gasto_extra_ganancia"("id_restaurante", "fecha")`);
            await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "cuota_fondo_gasto_fijo_id_gasto_fijo_fecha_key" ON "cuota_fondo_gasto_fijo"("id_gasto_fijo", "fecha")`);
            await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "cuota_fondo_gasto_fijo_id_restaurante_fecha_idx" ON "cuota_fondo_gasto_fijo"("id_restaurante", "fecha")`);
            await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "pago_fondo_gasto_fijo_id_restaurante_fecha_idx" ON "pago_fondo_gasto_fijo"("id_restaurante", "fecha")`);
            this.esquemaGananciasOk = true;
            this.columnasPeriodicidadOk = true;
            this.extraFondoAsegurado = true;
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`asegurarEsquemaGanancias: ${msg}`);
        }
    }
    async asegurarColumnasPeriodicidad() {
        await this.asegurarEsquemaGanancias();
    }
    ventanaConsultaExtras(fechaDesde, fechaHasta) {
        const desdeMes = this.parseFechaYmd(fechaDesde, 'fecha_desde').startOf('month');
        const hastaMes = this.parseFechaYmd(fechaHasta, 'fecha_hasta').endOf('month');
        return {
            startDateOnly: this.fechaOnlyFromYmd(desdeMes.toFormat('yyyy-LL-dd')),
            endDateOnly: this.fechaOnlyFromYmd(hastaMes.toFormat('yyyy-LL-dd')),
        };
    }
    montosFijoPersistidos(dto, existing) {
        const per = (0, ganancias_periodo_1.parsePeriodicidadGasto)(dto.periodicidad, (0, ganancias_periodo_1.parsePeriodicidadGasto)(existing?.periodicidad, 'mensual'));
        let ingresado = dto.monto_mensual != null ? Math.round(dto.monto_mensual) : null;
        if (ingresado == null && existing && dto.periodicidad) {
            const prev = (0, ganancias_periodo_1.parsePeriodicidadGasto)(existing.periodicidad, 'mensual');
            if (per !== prev) {
                ingresado =
                    per === 'diario'
                        ? existing.cuotaDiaria != null
                            ? Math.round(Number(existing.cuotaDiaria))
                            : (0, ganancias_periodo_1.cuotaDiariaSugerida)(Number(existing.montoMensual))
                        : Math.round(Number(existing.montoMensual));
            }
        }
        if (ingresado != null) {
            const p = (0, ganancias_periodo_1.persistenciaMontoFijo)({
                periodicidad: per,
                monto_ingresado: ingresado,
            });
            return {
                periodicidad: per,
                montoMensual: p.monto_mensual,
                montoDiario: p.monto_diario,
            };
        }
        return {
            periodicidad: per,
            montoMensual: Math.round(Number(existing?.montoMensual ?? 0)),
            montoDiario: existing?.cuotaDiaria != null
                ? Math.round(Number(existing.cuotaDiaria))
                : (0, ganancias_periodo_1.cuotaDiariaSugerida)(Number(existing?.montoMensual ?? 0)),
        };
    }
    mapFijoConSaldos(r, saldos) {
        const id = r.idGastoFijo;
        return this.mapGastoFijo(r, {
            acumulado_mes: saldos.acumuladoMes.get(id) ?? 0,
            acumulado_fondo: saldos.acumulado.get(id) ?? 0,
            pagado_fondo: saldos.pagado.get(id) ?? 0,
            pagado_fondo_mes: saldos.pagadoMes.get(id) ?? 0,
            pagos_fondo_mes: saldos.pagosMes.get(id) ?? [],
        });
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
        await this.asegurarColumnasPeriodicidad();
        const rows = await this.prisma.gastoFijoGanancia.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        });
        const saldos = await this.saldosFondo(tenantId, this.hoyYmd());
        return rows.map((r) => this.mapFijoConSaldos(r, saldos));
    }
    async crearGastoFijo(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.asegurarColumnasPeriodicidad();
        const montos = this.montosFijoPersistidos(dto);
        const cuotaDto = montos.periodicidad === 'diario' ? montos.montoDiario : dto.cuota_diaria;
        const fondo = this.resolverFondoFields({ ...dto, cuota_diaria: cuotaDto }, montos.montoMensual);
        const row = await this.prisma.gastoFijoGanancia.create({
            data: {
                idRestaurante: tenantId,
                nombre: dto.nombre.trim(),
                montoMensual: montos.montoMensual,
                activo: dto.activo !== false,
                notas: dto.notas?.trim() || null,
                usaFondoDiario: fondo.usaFondoDiario,
                cuotaDiaria: montos.periodicidad === 'diario'
                    ? montos.montoDiario
                    : fondo.cuotaDiaria,
                modoRegistroFondo: fondo.modoRegistroFondo,
                periodicidad: montos.periodicidad,
            },
        });
        return this.mapFijoConSaldos(row, await this.saldosFondo(tenantId, this.hoyYmd()));
    }
    async actualizarGastoFijo(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.asegurarColumnasPeriodicidad();
        const existing = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        const montos = this.montosFijoPersistidos(dto, existing);
        const cuotaDto = montos.periodicidad === 'diario'
            ? montos.montoDiario
            : dto.cuota_diaria;
        const fondo = this.resolverFondoFields({ ...dto, cuota_diaria: cuotaDto }, montos.montoMensual, existing);
        const row = await this.prisma.gastoFijoGanancia.update({
            where: { idGastoFijo: id },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                montoMensual: montos.montoMensual,
                ...(dto.activo != null ? { activo: dto.activo } : {}),
                ...(dto.notas !== undefined
                    ? { notas: dto.notas?.trim() || null }
                    : {}),
                usaFondoDiario: fondo.usaFondoDiario,
                cuotaDiaria: montos.periodicidad === 'diario'
                    ? montos.montoDiario
                    : fondo.cuotaDiaria,
                modoRegistroFondo: fondo.modoRegistroFondo,
                periodicidad: montos.periodicidad,
            },
        });
        return this.mapFijoConSaldos(row, await this.saldosFondo(tenantId, this.hoyYmd()));
    }
    async eliminarGastoFijo(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        const cuotas = await this.prisma.cuotaFondoGastoFijo.findMany({
            where: { idGastoFijo: id, idMovimientoCaja: { not: null } },
            select: { idMovimientoCaja: true },
        });
        const idsMov = cuotas
            .map((c) => c.idMovimientoCaja)
            .filter((x) => x != null);
        await this.prisma.$transaction(async (tx) => {
            if (idsMov.length > 0) {
                await tx.cuotaFondoGastoFijo.updateMany({
                    where: { idGastoFijo: id },
                    data: { idMovimientoCaja: null },
                });
                await tx.movimientoCaja.deleteMany({
                    where: { idMovimientoCaja: { in: idsMov } },
                });
            }
            await tx.gastoFijoGanancia.delete({ where: { idGastoFijo: id } });
        });
        return { ok: true };
    }
    async registrarPagoFondo(dto, tenantId) {
        const gasto = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo: dto.id_gasto_fijo, idRestaurante: tenantId },
        });
        if (!gasto)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        if (!gasto.usaFondoDiario) {
            throw new common_1.BadRequestException('Este gasto no tiene fondo diario');
        }
        const monto = Math.round(Number(dto.monto) || 0);
        if (monto <= 0) {
            throw new common_1.BadRequestException('El monto del pago debe ser mayor a 0');
        }
        const { ymd, fechaOnly } = this.resolverFechaCuota(dto.fecha);
        const saldos = await this.saldosFondo(tenantId, ymd);
        const disponible = (0, ganancias_periodo_1.disponibleFondo)(saldos.acumulado.get(gasto.idGastoFijo) ?? 0, saldos.pagado.get(gasto.idGastoFijo) ?? 0);
        if (monto > disponible) {
            throw new common_1.BadRequestException(`El fondo disponible es ${disponible}. No puede pagar más de lo reservado.`);
        }
        await this.prisma.pagoFondoGastoFijo.create({
            data: {
                idGastoFijo: gasto.idGastoFijo,
                idRestaurante: tenantId,
                fecha: fechaOnly,
                monto,
                notas: dto.notas?.trim() || null,
            },
        });
        const fijos = await this.listarGastosFijos(tenantId);
        return fijos.find((f) => f.id_gasto_fijo === gasto.idGastoFijo);
    }
    async eliminarPagoFondo(idPago, tenantId) {
        const row = await this.prisma.pagoFondoGastoFijo.findFirst({
            where: { idPagoFondo: idPago, idRestaurante: tenantId },
        });
        if (!row)
            throw new common_1.NotFoundException('Pago del fondo no encontrado');
        const idGasto = row.idGastoFijo;
        await this.prisma.pagoFondoGastoFijo.delete({
            where: { idPagoFondo: idPago },
        });
        const fijos = await this.listarGastosFijos(tenantId);
        return fijos.find((f) => f.id_gasto_fijo === idGasto);
    }
    async listarCuotasDia(fecha, tenantId) {
        const { ymd, fechaOnly } = this.resolverFechaCuota(fecha);
        const fijosAll = await this.prisma.gastoFijoGanancia.findMany({
            where: { idRestaurante: tenantId, activo: true },
            orderBy: { nombre: 'asc' },
        });
        const fijos = fijosAll.filter((g) => (0, ganancias_periodo_1.gastoFijoUsaRegistroDiario)({
            usa_fondo_diario: g.usaFondoDiario,
            periodicidad: g.periodicidad,
            modo_registro_fondo: g.modoRegistroFondo,
        }));
        const cuotasHoy = await this.prisma.cuotaFondoGastoFijo.findMany({
            where: { idRestaurante: tenantId, fecha: fechaOnly },
        });
        const porGasto = new Map(cuotasHoy.map((c) => [c.idGastoFijo, c]));
        const acum = await this.acumuladosMes(tenantId, ymd);
        const items = fijos.map((g) => {
            const row = porGasto.get(g.idGastoFijo);
            const cuotaDiaria = g.cuotaDiaria != null ? Math.round(Number(g.cuotaDiaria)) : 0;
            const montoMensual = Math.round(Number(g.montoMensual));
            const acumulado = acum.get(g.idGastoFijo) ?? 0;
            const estado = row
                ? row.estado
                : 'pendiente';
            return {
                id_gasto_fijo: g.idGastoFijo,
                nombre: g.nombre,
                cuota_diaria: cuotaDiaria,
                modo_registro_fondo: g.modoRegistroFondo,
                estado,
                monto: row ? Math.round(Number(row.monto)) : null,
                acumulado_mes: acumulado,
                monto_mensual: montoMensual,
                tope_alcanzado: (0, ganancias_periodo_1.parsePeriodicidadGasto)(g.periodicidad, 'mensual') === 'diario'
                    ? false
                    : (0, ganancias_periodo_1.topeFondoAlcanzado)(acumulado, montoMensual),
                periodicidad: (0, ganancias_periodo_1.parsePeriodicidadGasto)(g.periodicidad, 'mensual'),
                usa_fondo_diario: g.usaFondoDiario,
            };
        });
        return { fecha: ymd, items };
    }
    async asegurarCuotasAutomaticas(fecha, tenantId, idUsuario) {
        const { ymd } = this.resolverFechaCuota(fecha);
        const snap = await this.listarCuotasDia(ymd, tenantId);
        const fijos = await this.prisma.gastoFijoGanancia.findMany({
            where: { idRestaurante: tenantId, activo: true, usaFondoDiario: true },
        });
        const porId = new Map(fijos.map((g) => [g.idGastoFijo, g]));
        let aplicadas_ahora = 0;
        for (const item of snap.items) {
            const g = porId.get(item.id_gasto_fijo);
            if (!g)
                continue;
            if (!(0, ganancias_periodo_1.debeAutoAplicarCuota)({
                usa_fondo_diario: true,
                activo: g.activo,
                modo_registro_fondo: g.modoRegistroFondo,
                cuota_diaria: item.cuota_diaria,
                estado_hoy: item.estado,
                acumulado_mes: item.acumulado_mes,
                monto_mensual: item.monto_mensual,
                periodicidad: (0, ganancias_periodo_1.parsePeriodicidadGasto)(g.periodicidad, 'mensual'),
            })) {
                continue;
            }
            await this.aplicarCuotaDia(item.id_gasto_fijo, ymd, tenantId, idUsuario);
            aplicadas_ahora += 1;
        }
        const after = await this.listarCuotasDia(ymd, tenantId);
        return { ...after, aplicadas_ahora };
    }
    async aplicarCuotaDia(idGastoFijo, fecha, tenantId, _idUsuario, montoDia) {
        const { ymd, fechaOnly } = this.resolverFechaCuota(fecha);
        const gasto = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo, idRestaurante: tenantId },
        });
        if (!gasto)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        const puede = (0, ganancias_periodo_1.gastoFijoUsaRegistroDiario)({
            usa_fondo_diario: gasto.usaFondoDiario,
            periodicidad: gasto.periodicidad,
            modo_registro_fondo: gasto.modoRegistroFondo,
        });
        if (!gasto.activo || !puede) {
            throw new common_1.BadRequestException('Este gasto no se registra por día');
        }
        const sugerida = gasto.cuotaDiaria != null ? Math.round(Number(gasto.cuotaDiaria)) : 0;
        const cuotaDiaria = montoDia != null && Number(montoDia) > 0
            ? Math.round(Number(montoDia))
            : sugerida;
        if (cuotaDiaria <= 0) {
            throw new common_1.BadRequestException('Indica el monto de este día');
        }
        const existing = await this.prisma.cuotaFondoGastoFijo.findUnique({
            where: { idGastoFijo_fecha: { idGastoFijo, fecha: fechaOnly } },
        });
        if (existing?.estado === 'aplicada') {
            if (existing.idMovimientoCaja) {
                await this.prisma.cuotaFondoGastoFijo.update({
                    where: { idCuotaFondo: existing.idCuotaFondo },
                    data: { idMovimientoCaja: null },
                });
            }
            return this.listarCuotasDia(ymd, tenantId);
        }
        await this.prisma.$transaction(async (tx) => {
            if (existing?.idMovimientoCaja) {
                await tx.cuotaFondoGastoFijo.update({
                    where: { idCuotaFondo: existing.idCuotaFondo },
                    data: { idMovimientoCaja: null },
                });
            }
            if (existing) {
                await tx.cuotaFondoGastoFijo.update({
                    where: { idCuotaFondo: existing.idCuotaFondo },
                    data: {
                        monto: cuotaDiaria,
                        estado: 'aplicada',
                        idMovimientoCaja: null,
                    },
                });
            }
            else {
                await tx.cuotaFondoGastoFijo.create({
                    data: {
                        idGastoFijo,
                        idRestaurante: tenantId,
                        fecha: fechaOnly,
                        monto: cuotaDiaria,
                        estado: 'aplicada',
                    },
                });
            }
        });
        return this.listarCuotasDia(ymd, tenantId);
    }
    async omitirCuotaDia(idGastoFijo, fecha, tenantId, _idUsuario) {
        const { ymd, fechaOnly } = this.resolverFechaCuota(fecha);
        const gasto = await this.prisma.gastoFijoGanancia.findFirst({
            where: { idGastoFijo, idRestaurante: tenantId },
        });
        if (!gasto)
            throw new common_1.NotFoundException('Gasto fijo no encontrado');
        const puede = (0, ganancias_periodo_1.gastoFijoUsaRegistroDiario)({
            usa_fondo_diario: gasto.usaFondoDiario,
            periodicidad: gasto.periodicidad,
            modo_registro_fondo: gasto.modoRegistroFondo,
        });
        if (!puede) {
            throw new common_1.BadRequestException('Este gasto no se registra por día');
        }
        const cuotaDiaria = gasto.cuotaDiaria != null ? Math.round(Number(gasto.cuotaDiaria)) : 0;
        const existing = await this.prisma.cuotaFondoGastoFijo.findUnique({
            where: { idGastoFijo_fecha: { idGastoFijo, fecha: fechaOnly } },
        });
        await this.prisma.$transaction(async (tx) => {
            if (existing) {
                await tx.cuotaFondoGastoFijo.update({
                    where: { idCuotaFondo: existing.idCuotaFondo },
                    data: {
                        monto: cuotaDiaria,
                        estado: 'omitida',
                        idMovimientoCaja: null,
                    },
                });
            }
            else {
                await tx.cuotaFondoGastoFijo.create({
                    data: {
                        idGastoFijo,
                        idRestaurante: tenantId,
                        fecha: fechaOnly,
                        monto: cuotaDiaria,
                        estado: 'omitida',
                    },
                });
            }
        });
        return this.listarCuotasDia(ymd, tenantId);
    }
    async listarCuotasPeriodo(fechaDesde, fechaHasta, tenantId) {
        const rango = this.resolverRangoCuotas(fechaDesde, fechaHasta);
        const fijosAll = await this.prisma.gastoFijoGanancia.findMany({
            where: { idRestaurante: tenantId, activo: true },
            orderBy: { nombre: 'asc' },
        });
        const fijos = fijosAll.filter((g) => (0, ganancias_periodo_1.gastoFijoUsaRegistroDiario)({
            usa_fondo_diario: g.usaFondoDiario,
            periodicidad: g.periodicidad,
            modo_registro_fondo: g.modoRegistroFondo,
        }));
        const cuotasRango = await this.prisma.cuotaFondoGastoFijo.findMany({
            where: {
                idRestaurante: tenantId,
                fecha: {
                    gte: this.fechaOnlyFromYmd(rango.fecha_desde),
                    lte: this.fechaOnlyFromYmd(rango.fecha_hasta),
                },
            },
        });
        const ancla = rango.fecha_hasta;
        const acum = await this.acumuladosMes(tenantId, ancla);
        const items = fijos.map((g) => {
            const rows = cuotasRango.filter((c) => c.idGastoFijo === g.idGastoFijo);
            const porFecha = new Map(rows.map((c) => [
                luxon_1.DateTime.fromJSDate(c.fecha).toUTC().toFormat('yyyy-LL-dd'),
                c,
            ]));
            let aplicadas = 0;
            let omitidas = 0;
            let pendientes = 0;
            let monto_aplicado = 0;
            for (const ymd of rango.dias) {
                const row = porFecha.get(ymd);
                if (row?.estado === 'aplicada') {
                    aplicadas += 1;
                    monto_aplicado += Math.round(Number(row.monto));
                }
                else if (row?.estado === 'omitida') {
                    omitidas += 1;
                }
                else {
                    pendientes += 1;
                }
            }
            const cuotaDiaria = g.cuotaDiaria != null ? Math.round(Number(g.cuotaDiaria)) : 0;
            const montoMensual = Math.round(Number(g.montoMensual));
            const acumulado = acum.get(g.idGastoFijo) ?? 0;
            const estado = pendientes === 0 && omitidas === 0
                ? 'aplicada'
                : pendientes === 0 && aplicadas === 0
                    ? 'omitida'
                    : pendientes === rango.dias.length
                        ? 'pendiente'
                        : 'parcial';
            return {
                id_gasto_fijo: g.idGastoFijo,
                nombre: g.nombre,
                cuota_diaria: cuotaDiaria,
                modo_registro_fondo: g.modoRegistroFondo,
                estado,
                monto: aplicadas === 1 && pendientes === 0 && omitidas === 0
                    ? monto_aplicado
                    : aplicadas > 0
                        ? monto_aplicado
                        : null,
                acumulado_mes: acumulado,
                monto_mensual: montoMensual,
                tope_alcanzado: (0, ganancias_periodo_1.parsePeriodicidadGasto)(g.periodicidad, 'mensual') === 'diario'
                    ? false
                    : (0, ganancias_periodo_1.topeFondoAlcanzado)(acumulado, montoMensual),
                periodicidad: (0, ganancias_periodo_1.parsePeriodicidadGasto)(g.periodicidad, 'mensual'),
                usa_fondo_diario: g.usaFondoDiario,
                dias_periodo: rango.dias.length,
                aplicadas,
                omitidas,
                pendientes,
                monto_aplicado,
            };
        });
        return {
            fecha: rango.fecha_desde,
            fecha_desde: rango.fecha_desde,
            fecha_hasta: rango.fecha_hasta,
            dias: rango.dias.length,
            items,
        };
    }
    async asegurarCuotasAutomaticasPeriodo(fechaDesde, fechaHasta, tenantId, idUsuario) {
        const rango = this.resolverRangoCuotas(fechaDesde, fechaHasta);
        let aplicadas_ahora = 0;
        for (const ymd of rango.dias) {
            const r = await this.asegurarCuotasAutomaticas(ymd, tenantId, idUsuario);
            aplicadas_ahora += r.aplicadas_ahora ?? 0;
        }
        const after = await this.listarCuotasPeriodo(rango.fecha_desde, rango.fecha_hasta, tenantId);
        return { ...after, aplicadas_ahora };
    }
    async aplicarCuotaPeriodo(idGastoFijo, fechaDesde, fechaHasta, tenantId, idUsuario, montoDia) {
        const rango = this.resolverRangoCuotas(fechaDesde, fechaHasta);
        for (const ymd of rango.dias) {
            const { fechaOnly } = this.resolverFechaCuota(ymd);
            const existing = await this.prisma.cuotaFondoGastoFijo.findUnique({
                where: { idGastoFijo_fecha: { idGastoFijo, fecha: fechaOnly } },
            });
            if (existing?.estado === 'aplicada' || existing?.estado === 'omitida') {
                continue;
            }
            await this.aplicarCuotaDia(idGastoFijo, ymd, tenantId, idUsuario, montoDia);
        }
        return this.listarCuotasPeriodo(rango.fecha_desde, rango.fecha_hasta, tenantId);
    }
    async omitirCuotaPeriodo(idGastoFijo, fechaDesde, fechaHasta, tenantId, idUsuario) {
        const rango = this.resolverRangoCuotas(fechaDesde, fechaHasta);
        for (const ymd of rango.dias) {
            const { fechaOnly } = this.resolverFechaCuota(ymd);
            const existing = await this.prisma.cuotaFondoGastoFijo.findUnique({
                where: { idGastoFijo_fecha: { idGastoFijo, fecha: fechaOnly } },
            });
            if (existing?.estado === 'aplicada')
                continue;
            await this.omitirCuotaDia(idGastoFijo, ymd, tenantId, idUsuario);
        }
        return this.listarCuotasPeriodo(rango.fecha_desde, rango.fecha_hasta, tenantId);
    }
    async listarGastosExtras(opts, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.asegurarColumnasExtraFondo();
        await this.asegurarColumnasPeriodicidad();
        const rango = this.resolverRango({
            periodo: 'personalizado',
            fecha_desde: opts.fecha_desde,
            fecha_hasta: opts.fecha_hasta ?? opts.fecha_desde,
        });
        const ventana = this.ventanaConsultaExtras(rango.fecha_desde, rango.fecha_hasta);
        const rows = await this.prisma.gastoExtraGanancia.findMany({
            where: {
                idRestaurante: tenantId,
                fecha: { gte: ventana.startDateOnly, lte: ventana.endDateOnly },
            },
            orderBy: [{ fecha: 'desc' }, { idGastoExtra: 'desc' }],
        });
        return rows
            .filter((r) => (0, ganancias_periodo_1.extraAplicaEnPeriodo)({
            fecha: luxon_1.DateTime.fromJSDate(r.fecha).toUTC().toFormat('yyyy-LL-dd'),
            periodicidad: r.periodicidad,
            fecha_desde: rango.fecha_desde,
            fecha_hasta: rango.fecha_hasta,
        }))
            .map((r) => this.mapExtra(r, rango.fecha_desde, rango.fecha_hasta));
    }
    extraFondoAsegurado = false;
    async asegurarColumnasExtraFondo() {
        await this.asegurarEsquemaGanancias();
    }
    mapExtra(r, fechaDesde, fechaHasta) {
        const usa = Boolean(r.usaFondo);
        const fecha = luxon_1.DateTime.fromJSDate(r.fecha).toUTC().toFormat('yyyy-LL-dd');
        const periodicidad = (0, ganancias_periodo_1.parsePeriodicidadGasto)(r.periodicidad, 'diario');
        const monto = Math.round(Number(r.monto));
        const monto_en_periodo = fechaDesde && fechaHasta
            ? (0, ganancias_periodo_1.montoExtraEnPeriodo)({
                monto,
                fecha,
                periodicidad,
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
            })
            : monto;
        return {
            id_gasto_extra: r.idGastoExtra,
            nombre: r.nombre,
            monto,
            monto_en_periodo,
            fecha,
            notas: r.notas,
            usa_fondo: usa,
            pagado_fondo: r.pagadoFondo !== false,
            periodicidad,
        };
    }
    async crearGastoExtra(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.asegurarColumnasExtraFondo();
        await this.asegurarColumnasPeriodicidad();
        const fecha = this.parseFechaYmd(dto.fecha, 'fecha');
        const usaFondo = dto.usa_fondo === true;
        const periodicidad = (0, ganancias_periodo_1.parsePeriodicidadGasto)(dto.periodicidad, 'diario');
        const row = await this.prisma.gastoExtraGanancia.create({
            data: {
                idRestaurante: tenantId,
                nombre: dto.nombre.trim(),
                monto: Math.round(dto.monto),
                fecha: fecha.toJSDate(),
                notas: dto.notas?.trim() || null,
                usaFondo,
                pagadoFondo: !usaFondo,
                periodicidad,
            },
        });
        return this.mapExtra(row);
    }
    async actualizarGastoExtra(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.gastoExtraGanancia.findFirst({
            where: { idGastoExtra: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Gasto extra no encontrado');
        await this.asegurarColumnasExtraFondo();
        await this.asegurarColumnasPeriodicidad();
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
                ...(dto.usa_fondo != null ? { usaFondo: dto.usa_fondo } : {}),
                ...(dto.pagado_fondo != null ? { pagadoFondo: dto.pagado_fondo } : {}),
                ...(dto.periodicidad != null
                    ? { periodicidad: (0, ganancias_periodo_1.parsePeriodicidadGasto)(dto.periodicidad, 'diario') }
                    : {}),
            },
        });
        return this.mapExtra(row);
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
        await this.asegurarEsquemaGanancias();
        const mesHasta = (0, ganancias_periodo_1.rangoMesCalendario)(rango.fecha_hasta);
        const cuotasDesde = mesHasta && mesHasta.desde < rango.fecha_desde
            ? mesHasta.desde
            : rango.fecha_desde;
        const cuotasHasta = mesHasta && mesHasta.hasta > rango.fecha_hasta
            ? mesHasta.hasta
            : rango.fecha_hasta;
        const ventanaExtras = this.ventanaConsultaExtras(rango.fecha_desde, rango.fecha_hasta);
        const fechaDesdeDb = luxon_1.DateTime.fromISO(rango.fecha_desde, {
            zone: 'America/Bogota',
        });
        const fechaHastaDb = luxon_1.DateTime.fromISO(rango.fecha_hasta, {
            zone: 'America/Bogota',
        });
        const facturaWhere = {
            emitidaEn: { gte: rango.start, lt: rango.end },
            pedido: { idRestaurante: tenantId },
        };
        const detalleSelectConReceta = {
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
        };
        const detalleSelectSinReceta = {
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
                    },
                },
            },
        };
        const cargarFacturas = async () => {
            try {
                return (await this.prisma.factura.findMany({
                    where: facturaWhere,
                    select: {
                        idFactura: true,
                        total: true,
                        metodoPago: true,
                        detalles: detalleSelectConReceta,
                    },
                }));
            }
            catch (e) {
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    (e.code === 'P2021' || e.code === 'P2022')) {
                    this.logger.warn(`Reporte ganancias: facturas sin join receta (${e.code})`);
                    return (await this.prisma.factura.findMany({
                        where: facturaWhere,
                        select: {
                            idFactura: true,
                            total: true,
                            metodoPago: true,
                            detalles: detalleSelectSinReceta,
                        },
                    }));
                }
                throw e;
            }
        };
        const [cfg, facturas, fijos, cuotasRows, extras, pagosMeseroRows] = await Promise.all([
            this.prisma.configRestaurante.findUnique({
                where: { idRestaurante: tenantId },
                select: { nombreComercial: true },
            }),
            cargarFacturas(),
            this.prisma.gastoFijoGanancia.findMany({
                where: { idRestaurante: tenantId, activo: true },
            }),
            this.prisma.cuotaFondoGastoFijo.findMany({
                where: {
                    idRestaurante: tenantId,
                    estado: 'aplicada',
                    fecha: {
                        gte: this.fechaOnlyFromYmd(cuotasDesde),
                        lte: this.fechaOnlyFromYmd(cuotasHasta),
                    },
                },
            }),
            this.prisma.gastoExtraGanancia.findMany({
                where: {
                    idRestaurante: tenantId,
                    fecha: {
                        gte: ventanaExtras.startDateOnly,
                        lte: ventanaExtras.endDateOnly,
                    },
                },
                orderBy: [{ fecha: 'asc' }, { idGastoExtra: 'asc' }],
            }),
            this.prisma.registroBeneficioMesero
                .findMany({
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
                    mesero: {
                        select: {
                            nombre: true,
                            apellido: true,
                            rol: { select: { nombre: true } },
                        },
                    },
                },
                orderBy: [{ fecha: 'asc' }, { idRegistro: 'asc' }],
            })
                .catch((e) => {
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.warn(`Reporte ganancias: pagos mesero omitidos (${msg})`);
                return [];
            }),
        ]);
        const ventas_por_metodo = (0, ganancias_periodo_1.agruparVentasPorMetodoPago)(facturas.map((f) => ({
            metodo_pago: f.metodoPago,
            total: Number(f.total),
        })));
        const ventas = ventas_por_metodo.total;
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
        const fijosPeriodo = (0, ganancias_periodo_1.armarGastosFijosPeriodo)(fijos.map((g) => ({
            id: g.idGastoFijo,
            nombre: g.nombre,
            monto_mensual: Number(g.montoMensual),
            usa_fondo_diario: g.usaFondoDiario,
            cuota_diaria: g.cuotaDiaria != null ? Math.round(Number(g.cuotaDiaria)) : null,
            periodicidad: (0, ganancias_periodo_1.parsePeriodicidadGasto)(g.periodicidad, 'mensual'),
            modo_registro_fondo: g.modoRegistroFondo === 'confirmar' ? 'confirmar' : 'automatico',
        })), cuotasRows.map((c) => ({
            id_gasto_fijo: c.idGastoFijo,
            monto: Math.round(Number(c.monto)),
            fecha: luxon_1.DateTime.fromJSDate(c.fecha).toUTC().toFormat('yyyy-LL-dd'),
            estado: c.estado,
        })), rango.fecha_desde, rango.fecha_hasta);
        const gastos_extras_detalle = extras
            .filter((e) => (0, ganancias_periodo_1.extraAplicaEnPeriodo)({
            fecha: luxon_1.DateTime.fromJSDate(e.fecha).toUTC().toFormat('yyyy-LL-dd'),
            periodicidad: e.periodicidad,
            fecha_desde: rango.fecha_desde,
            fecha_hasta: rango.fecha_hasta,
        }))
            .map((e) => this.mapExtra(e, rango.fecha_desde, rango.fecha_hasta));
        const gastos_extras = gastos_extras_detalle.reduce((s, e) => s + e.monto_en_periodo, 0);
        const pagos_meseros = pagosMeseroRows.map((r) => ({
            id_registro: r.idRegistro,
            id_usuario: r.idUsuario,
            mesero: `${r.mesero.nombre} ${r.mesero.apellido}`.trim(),
            rol: r.mesero.rol.nombre,
            monto: Math.round(Number(r.monto ?? 0)),
            fecha: luxon_1.DateTime.fromJSDate(r.fecha).toUTC().toFormat('yyyy-LL-dd'),
        }));
        const gastos_meseros = pagos_meseros.reduce((s, p) => s + p.monto, 0);
        const resumen = (0, ganancias_periodo_1.armarResumenGanancias)({
            ventas,
            lineas: por_producto,
            gastos_fijos: fijosPeriodo.total,
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
            gastos_fijos: fijosPeriodo.detalle.map((d) => ({
                id: d.id,
                nombre: d.nombre,
                monto_mensual: d.monto_mensual,
                monto_periodo: d.monto_periodo,
                usa_fondo_diario: d.usa_fondo_diario,
                cuota_diaria: d.cuota_diaria,
                acumulado_mes: d.acumulado_mes,
                periodicidad: d.periodicidad,
            })),
            gastos_extras: gastos_extras_detalle,
            pagos_meseros,
            facturas_count: facturas.length,
            ventas_por_metodo,
        };
    }
    async reportePdf(opts, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const data = await this.reporte(opts, tenantId);
        return (0, ganancias_pdf_1.buildGananciasPdf)(data);
    }
};
exports.GananciasService = GananciasService;
exports.GananciasService = GananciasService = GananciasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GananciasService);
//# sourceMappingURL=ganancias.service.js.map