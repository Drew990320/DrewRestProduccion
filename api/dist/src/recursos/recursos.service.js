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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RecursosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecursosService = void 0;
exports.nivelStock = nivelStock;
const common_1 = require("@nestjs/common");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const recurso_comportamiento_1 = require("@drewrest/shared-domain/recurso-comportamiento");
const recurso_movimientos_1 = require("@drewrest/shared-domain/recurso-movimientos");
const inventario_unidades_1 = require("@drewrest/shared-domain/inventario-unidades");
const stock_auditoria_1 = require("../common/stock-auditoria");
const inventario_costo_1 = require("@drewrest/shared-domain/inventario-costo");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const recurso_stock_producto_1 = require("./recurso-stock-producto");
const recursos_migracion_service_1 = require("./recursos-migracion.service");
const deduccion_contexto_cache_1 = require("../inventario/deduccion-contexto-cache");
const inventario_receta_service_1 = require("../inventario/inventario-receta.service");
const RECETAS_VACIAS = {
    productos_actualizados: 0,
    ids_producto: [],
};
const PRESENTACIONES_INCLUDE = { orderBy: { factor: 'asc' } };
const RANGO_NIVEL = { ok: 0, bajo: 1, agotado: 2, negativo: 3 };
function nivelStock(stock, stockMin) {
    if (stock < 0)
        return 'negativo';
    if (stock <= 0)
        return 'agotado';
    if (stockMin > 0 && stock <= stockMin)
        return 'bajo';
    return 'ok';
}
const ALERTA_STOCK_DELAY_MS = 600;
let RecursosService = RecursosService_1 = class RecursosService {
    prisma;
    migracion;
    recetasCosto;
    gateway;
    validarUnidadRecurso(unidad) {
        const u = unidad.trim();
        if (!u)
            throw new common_1.BadRequestException('Indica la unidad del artículo (u, kg, g, l, ml…)');
        if (/^[\d.,\s]+$/.test(u)) {
            throw new common_1.BadRequestException(`«${u}» no es una unidad de medida. Usa u, kg, g, l o ml. La cantidad va en stock.`);
        }
        if ((0, inventario_unidades_1.esUnidadEmpaque)(u)) {
            throw new common_1.BadRequestException(`«${u}» es un empaque. Registra el artículo en u, g, kg, ml o l y agrega «${u}» como presentación (ej. 1 ${u} = 10 u).`);
        }
    }
    mapPresentacion(p) {
        return {
            id_presentacion: p.idPresentacion,
            nombre: p.nombre,
            factor: Number(p.factor),
            codigo_barras: p.codigoBarras,
            costo_ultimo: p.costoUltimo != null ? Number(p.costoUltimo) : null,
            predeterminada: p.predeterminada,
        };
    }
    validarNombrePresentacion(nombre, unidadBase) {
        const n = nombre.trim();
        if ((0, inventario_unidades_1.normalizarUnidad)(n) === (0, inventario_unidades_1.normalizarUnidad)(unidadBase)) {
            throw new common_1.BadRequestException(`«${n}» ya es la unidad base del artículo`);
        }
        if ((0, inventario_unidades_1.unidadesCompatibles)(unidadBase).some((u) => (0, inventario_unidades_1.normalizarUnidad)(u) === (0, inventario_unidades_1.normalizarUnidad)(n))) {
            throw new common_1.BadRequestException(`«${n}» ya se convierte sola desde ${unidadBase}; no hace falta como presentación`);
        }
    }
    constructor(prisma, migracion, recetasCosto, gateway) {
        this.prisma = prisma;
        this.migracion = migracion;
        this.recetasCosto = recetasCosto;
        this.gateway = gateway;
    }
    logger = new common_1.Logger(RecursosService_1.name);
    alertasPendientes = new Set();
    programarAlertaStock(tenantId, idRecurso) {
        const key = `${tenantId}:${idRecurso}`;
        if (this.alertasPendientes.has(key))
            return;
        this.alertasPendientes.add(key);
        setTimeout(() => {
            this.alertasPendientes.delete(key);
            void this.emitirAlertaStock(tenantId, idRecurso).catch((e) => this.logger.warn(`Alerta de stock ${key}: ${e.message}`));
        }, ALERTA_STOCK_DELAY_MS);
    }
    async emitirAlertaStock(tenantId, idRecurso) {
        if (!this.gateway)
            return;
        const r = await this.prisma.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            include: { presentaciones: PRESENTACIONES_INCLUDE },
        });
        if (!r || r.estado === 'baja')
            return;
        const stock = this.qty(r.stock);
        const stockMin = this.qty(r.stockMin);
        const nivel = nivelStock(stock, stockMin);
        if (nivel === 'ok')
            return;
        this.gateway.emitInventarioAlerta({
            id_recurso: r.idRecurso,
            nombre: r.nombre,
            nivel,
            stock,
            stock_min: stockMin,
            unidad: r.unidad,
            stock_desglose: (0, inventario_unidades_1.desglosePresentacion)(stock, r.unidad, r.presentaciones.map((p) => this.mapPresentacion(p))),
            at: new Date().toISOString(),
        }, tenantId);
    }
    async alertasStock(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.recurso.findMany({
            where: { idRestaurante: tenantId, estado: { not: 'baja' } },
            include: { categoria: true, presentaciones: PRESENTACIONES_INCLUDE },
            orderBy: { nombre: 'asc' },
        });
        const items = rows
            .filter((r) => {
            const f = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(r.categoria);
            return f.controla_stock && !f.es_activo_fijo;
        })
            .map((r) => {
            const stock = this.qty(r.stock);
            const stockMin = this.qty(r.stockMin);
            return {
                id_recurso: r.idRecurso,
                nombre: r.nombre,
                nivel: nivelStock(stock, stockMin),
                stock,
                stock_min: stockMin,
                unidad: r.unidad,
                stock_desglose: (0, inventario_unidades_1.desglosePresentacion)(stock, r.unidad, r.presentaciones.map((p) => this.mapPresentacion(p))),
            };
        })
            .filter((x) => x.nivel !== 'ok')
            .sort((a, b) => RANGO_NIVEL[b.nivel] - RANGO_NIVEL[a.nivel]);
        return {
            total: items.length,
            bajos: items.filter((x) => x.nivel === 'bajo').length,
            agotados: items.filter((x) => x.nivel !== 'bajo').length,
            items,
        };
    }
    qty(v) {
        return (0, inventario_unidades_1.redondearInventario)(Number(v));
    }
    mapCategoria(c) {
        return {
            id_categoria: c.idCategoria,
            codigo: c.codigo,
            nombre: c.nombre,
            descripcion: c.descripcion,
            activa: c.activa,
            orden: c.orden,
            controla_stock: c.controlaStock,
            se_consume_auto: c.seConsumeAuto,
            puede_venderse: c.puedeVenderse,
            requiere_receta: c.requiereReceta,
            controla_vencimiento: c.controlaVencimiento,
            controla_lote: c.controlaLote,
            maneja_serie: c.manejaSerie,
            requiere_mantenimiento: c.requiereMantenimiento,
            es_activo_fijo: c.esActivoFijo,
            permite_depreciacion: c.permiteDepreciacion,
            tiene_responsable: c.tieneResponsable,
            tiene_ubicacion: c.tieneUbicacion,
            permite_prestamo: c.permitePrestamo,
        };
    }
    mapRecurso(r) {
        const stock = this.qty(r.stock);
        const stockMin = this.qty(r.stockMin);
        const presentaciones = (r.presentaciones ?? []).map((p) => this.mapPresentacion(p));
        return {
            id_recurso: r.idRecurso,
            codigo: r.codigo,
            nombre: r.nombre,
            descripcion: r.descripcion,
            id_categoria: r.idCategoria,
            unidad: r.unidad,
            unidad_es_empaque: (0, inventario_unidades_1.esUnidadEmpaque)(r.unidad),
            presentaciones,
            stock_desglose: (0, inventario_unidades_1.desglosePresentacion)(stock, r.unidad, presentaciones),
            costo: Number(r.costo),
            costo_referencia: r.costoReferencia != null && Number(r.costoReferencia) > 0
                ? Number(r.costoReferencia)
                : Number(r.costo) > 0
                    ? Number(r.costo)
                    : null,
            precio: r.precio != null ? Number(r.precio) : null,
            stock,
            stock_min: stockMin,
            stock_max: r.stockMax != null ? this.qty(r.stockMax) : null,
            estado: r.estado,
            critico: stock > 0 && stock <= stockMin,
            id_proveedor: r.idProveedor,
            id_ubicacion: r.idUbicacion,
            id_responsable: r.idResponsable,
            codigo_barras: r.codigoBarras,
            codigo_qr: r.codigoQr,
            numero_serie: r.numeroSerie,
            fecha_compra: r.fechaCompra?.toISOString().slice(0, 10) ?? null,
            fecha_vencimiento: r.fechaVencimiento?.toISOString().slice(0, 10) ?? null,
            observaciones: r.observaciones,
            id_producto: r.idProducto,
            id_inventario_legacy: r.idInventarioLegacy,
            categoria: r.categoria ? this.mapCategoria(r.categoria) : undefined,
            ubicacion: r.ubicacion
                ? { id_ubicacion: r.ubicacion.idUbicacion, nombre: r.ubicacion.nombre }
                : null,
            responsable: r.responsable
                ? {
                    id_usuario: r.responsable.idUsuario,
                    nombre: `${r.responsable.nombre} ${r.responsable.apellido}`.trim(),
                }
                : null,
        };
    }
    validarCamposContraCategoria(flags, data) {
        if (flags.maneja_serie && !data.numeroSerie?.trim()) {
            throw new common_1.BadRequestException('Esta categoría exige número de serie');
        }
        if (flags.tiene_responsable && data.idResponsable == null) {
            throw new common_1.BadRequestException('Esta categoría exige responsable');
        }
        if (flags.tiene_ubicacion && data.idUbicacion == null) {
            throw new common_1.BadRequestException('Esta categoría exige ubicación');
        }
    }
    async listarCategorias(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.categoriaRecurso.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        });
        return rows.map((c) => this.mapCategoria(c));
    }
    async crearCategoria(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.asegurarCategoriasYUbicaciones(tenantId);
        const codigo = dto.codigo.trim().toLowerCase().replace(/\s+/g, '_');
        try {
            const c = await this.prisma.categoriaRecurso.create({
                data: {
                    idRestaurante: tenantId,
                    codigo,
                    nombre: dto.nombre.trim(),
                    descripcion: dto.descripcion?.trim() || null,
                    orden: dto.orden ?? 200,
                    controlaStock: dto.controla_stock ?? true,
                    seConsumeAuto: dto.se_consume_auto ?? false,
                    puedeVenderse: dto.puede_venderse ?? false,
                    requiereReceta: dto.requiere_receta ?? false,
                    controlaVencimiento: dto.controla_vencimiento ?? false,
                    controlaLote: dto.controla_lote ?? false,
                    manejaSerie: dto.maneja_serie ?? false,
                    requiereMantenimiento: dto.requiere_mantenimiento ?? false,
                    esActivoFijo: dto.es_activo_fijo ?? false,
                    permiteDepreciacion: dto.permite_depreciacion ?? false,
                    tieneResponsable: dto.tiene_responsable ?? false,
                    tieneUbicacion: dto.tiene_ubicacion ?? false,
                    permitePrestamo: dto.permite_prestamo ?? false,
                },
            });
            return this.mapCategoria(c);
        }
        catch {
            throw new common_1.BadRequestException('Código de categoría ya existe');
        }
    }
    async actualizarCategoria(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.categoriaRecurso.findFirst({
            where: { idCategoria: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Categoría no encontrada');
        const c = await this.prisma.categoriaRecurso.update({
            where: { idCategoria: id },
            data: {
                nombre: dto.nombre?.trim(),
                descripcion: dto.descripcion === undefined ? undefined : dto.descripcion?.trim() || null,
                activa: dto.activa,
                orden: dto.orden,
                controlaStock: dto.controla_stock,
                seConsumeAuto: dto.se_consume_auto,
                puedeVenderse: dto.puede_venderse,
                requiereReceta: dto.requiere_receta,
                controlaVencimiento: dto.controla_vencimiento,
                controlaLote: dto.controla_lote,
                manejaSerie: dto.maneja_serie,
                requiereMantenimiento: dto.requiere_mantenimiento,
                esActivoFijo: dto.es_activo_fijo,
                permiteDepreciacion: dto.permite_depreciacion,
                tieneResponsable: dto.tiene_responsable,
                tieneUbicacion: dto.tiene_ubicacion,
                permitePrestamo: dto.permite_prestamo,
            },
        });
        return this.mapCategoria(c);
    }
    async listarUbicaciones(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.ubicacionRecurso.findMany({
            where: { idRestaurante: tenantId },
            orderBy: { nombre: 'asc' },
        });
        return rows.map((u) => ({
            id_ubicacion: u.idUbicacion,
            nombre: u.nombre,
            codigo: u.codigo,
            activa: u.activa,
        }));
    }
    async crearUbicacion(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        try {
            const u = await this.prisma.ubicacionRecurso.create({
                data: {
                    idRestaurante: tenantId,
                    nombre: dto.nombre.trim(),
                    codigo: dto.codigo?.trim() || null,
                },
            });
            return {
                id_ubicacion: u.idUbicacion,
                nombre: u.nombre,
                codigo: u.codigo,
                activa: u.activa,
            };
        }
        catch {
            throw new common_1.BadRequestException('Ya existe una ubicación con ese nombre');
        }
    }
    async actualizarUbicacion(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.ubicacionRecurso.findFirst({
            where: { idUbicacion: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Ubicación no encontrada');
        const u = await this.prisma.ubicacionRecurso.update({
            where: { idUbicacion: id },
            data: {
                nombre: dto.nombre?.trim(),
                codigo: dto.codigo === undefined ? undefined : dto.codigo?.trim() || null,
                activa: dto.activa,
            },
        });
        return {
            id_ubicacion: u.idUbicacion,
            nombre: u.nombre,
            codigo: u.codigo,
            activa: u.activa,
        };
    }
    async listarRecursos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, filtros) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.recurso.findMany({
            where: {
                idRestaurante: tenantId,
                ...(filtros?.id_categoria != null
                    ? { idCategoria: filtros.id_categoria }
                    : {}),
                ...(filtros?.id_ubicacion != null
                    ? { idUbicacion: filtros.id_ubicacion }
                    : {}),
                ...(filtros?.estado && (0, recurso_comportamiento_1.esEstadoRecurso)(filtros.estado)
                    ? { estado: filtros.estado }
                    : {}),
            },
            include: {
                categoria: true,
                ubicacion: true,
                responsable: { select: { idUsuario: true, nombre: true, apellido: true } },
                presentaciones: PRESENTACIONES_INCLUDE,
            },
            orderBy: { nombre: 'asc' },
        });
        let mapped = rows.map((r) => this.mapRecurso(r));
        if (filtros?.bajo_minimo) {
            mapped = mapped.filter((r) => r.critico || r.estado === 'agotado');
        }
        return mapped;
    }
    async obtenerRecurso(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const r = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
            include: {
                categoria: true,
                ubicacion: true,
                responsable: { select: { idUsuario: true, nombre: true, apellido: true } },
                presentaciones: PRESENTACIONES_INCLUDE,
            },
        });
        if (!r)
            throw new common_1.NotFoundException('Recurso no encontrado');
        return this.mapRecurso(r);
    }
    async crearRecurso(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        await this.migracion.asegurarCategoriasYUbicaciones(tenantId);
        const cat = await this.prisma.categoriaRecurso.findFirst({
            where: { idCategoria: dto.id_categoria, idRestaurante: tenantId },
        });
        if (!cat)
            throw new common_1.BadRequestException('Categoría no válida');
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(cat);
        this.validarCamposContraCategoria(flags, {
            numeroSerie: dto.numero_serie,
            idResponsable: dto.id_responsable,
            idUbicacion: dto.id_ubicacion,
        });
        this.validarUnidadRecurso(dto.unidad);
        const unidadBase = (0, inventario_unidades_1.unidadCanonica)(dto.unidad);
        const presentacionesNuevas = dto.presentaciones ?? [];
        const nombresPres = new Set();
        for (const p of presentacionesNuevas) {
            this.validarNombrePresentacion(p.nombre, unidadBase);
            const key = (0, inventario_unidades_1.normalizarUnidad)(p.nombre);
            if (nombresPres.has(key)) {
                throw new common_1.BadRequestException(`La presentación «${p.nombre.trim()}» está repetida`);
            }
            nombresPres.add(key);
        }
        const estado = dto.estado && (0, recurso_comportamiento_1.esEstadoRecurso)(dto.estado) ? dto.estado : 'activo';
        const stockInicial = dto.stock_inicial ?? 0;
        const mapped = await this.prisma.$transaction(async (tx) => {
            let rec;
            try {
                rec = await tx.recurso.create({
                    data: {
                        idRestaurante: tenantId,
                        codigo: dto.codigo.trim(),
                        nombre: dto.nombre.trim(),
                        descripcion: dto.descripcion?.trim() || null,
                        idCategoria: dto.id_categoria,
                        unidad: unidadBase,
                        costo: dto.costo ?? 0,
                        costoReferencia: dto.costo != null && dto.costo > 0 ? dto.costo : null,
                        precio: dto.precio ?? null,
                        stock: 0,
                        stockMin: dto.stock_min ?? 0,
                        stockMax: dto.stock_max ?? null,
                        estado: stockInicial <= 0 && flags.controla_stock ? 'agotado' : estado,
                        idProveedor: dto.id_proveedor ?? null,
                        idUbicacion: dto.id_ubicacion ?? null,
                        idResponsable: dto.id_responsable ?? null,
                        codigoBarras: dto.codigo_barras?.trim() || null,
                        codigoQr: dto.codigo_qr?.trim() || null,
                        numeroSerie: dto.numero_serie?.trim() || null,
                        fechaCompra: dto.fecha_compra ? new Date(dto.fecha_compra) : null,
                        fechaVencimiento: dto.fecha_vencimiento
                            ? new Date(dto.fecha_vencimiento)
                            : null,
                        observaciones: dto.observaciones?.trim() || null,
                        idProducto: dto.id_producto ?? null,
                    },
                    include: {
                        categoria: true,
                        ubicacion: true,
                        responsable: {
                            select: { idUsuario: true, nombre: true, apellido: true },
                        },
                        presentaciones: PRESENTACIONES_INCLUDE,
                    },
                });
            }
            catch {
                throw new common_1.BadRequestException('Código de recurso ya existe');
            }
            if (presentacionesNuevas.length) {
                const hayPredeterminada = presentacionesNuevas.some((p) => p.predeterminada);
                await tx.presentacionRecurso.createMany({
                    data: presentacionesNuevas.map((p, i) => ({
                        idRecurso: rec.idRecurso,
                        nombre: p.nombre.trim(),
                        factor: p.factor,
                        codigoBarras: p.codigo_barras?.trim() || null,
                        predeterminada: hayPredeterminada ? Boolean(p.predeterminada) : i === 0,
                    })),
                });
            }
            if (stockInicial > 0 && flags.controla_stock) {
                await this.aplicarMovimientoTx(tx, rec.idRecurso, tenantId, {
                    tipo: 'compra',
                    cantidad: stockInicial,
                    costo_unitario: dto.costo,
                    observacion: 'Stock inicial',
                    modulo_origen: 'recursos',
                    id_documento: `stock-inicial:${rec.idRecurso}`,
                    id_usuario: idUsuario,
                });
            }
            if (presentacionesNuevas.length || (stockInicial > 0 && flags.controla_stock)) {
                rec = await tx.recurso.findUniqueOrThrow({
                    where: { idRecurso: rec.idRecurso },
                    include: {
                        categoria: true,
                        ubicacion: true,
                        responsable: {
                            select: { idUsuario: true, nombre: true, apellido: true },
                        },
                        presentaciones: PRESENTACIONES_INCLUDE,
                    },
                });
            }
            if (rec.idProducto != null) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, rec.idProducto, tenantId);
            }
            (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
            return this.mapRecurso(rec);
        });
        if (stockInicial > 0) {
            const recetas_recalculadas = await this.recetasCosto.recalcularPorRecurso(mapped.id_recurso, tenantId);
            return { ...mapped, recetas_recalculadas };
        }
        return { ...mapped, recetas_recalculadas: RECETAS_VACIAS };
    }
    async actualizarRecurso(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, actor) {
        const existing = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
            include: { categoria: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const idCategoria = dto.id_categoria ?? existing.idCategoria;
        const cat = await this.prisma.categoriaRecurso.findFirst({
            where: { idCategoria, idRestaurante: tenantId },
        });
        if (!cat)
            throw new common_1.BadRequestException('Categoría no válida');
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(cat);
        this.validarCamposContraCategoria(flags, {
            numeroSerie: dto.numero_serie !== undefined
                ? dto.numero_serie
                : existing.numeroSerie,
            idResponsable: dto.id_responsable !== undefined
                ? dto.id_responsable
                : existing.idResponsable,
            idUbicacion: dto.id_ubicacion !== undefined
                ? dto.id_ubicacion
                : existing.idUbicacion,
        });
        if (dto.estado != null && !(0, recurso_comportamiento_1.esEstadoRecurso)(dto.estado)) {
            throw new common_1.BadRequestException('Estado no válido');
        }
        const cambiaUnidad = dto.unidad !== undefined &&
            (0, inventario_unidades_1.normalizarUnidad)(dto.unidad) !== (0, inventario_unidades_1.normalizarUnidad)(existing.unidad);
        if (cambiaUnidad) {
            this.validarUnidadRecurso(dto.unidad);
            const movimientos = await this.prisma.movimientoRecurso.count({ where: { idRecurso: id } });
            if (movimientos > 0 || Number(existing.stock) !== 0) {
                throw new common_1.BadRequestException('Este artículo ya tiene movimientos: cambiar la unidad descuadraría el kardex. Usa «Convertir unidad» para recalcular stock, costo e historial.');
            }
        }
        try {
            const r = await this.prisma.recurso.update({
                where: { idRecurso: id },
                data: {
                    codigo: dto.codigo?.trim(),
                    nombre: dto.nombre?.trim(),
                    descripcion: dto.descripcion === undefined
                        ? undefined
                        : dto.descripcion?.trim() || null,
                    idCategoria: dto.id_categoria,
                    unidad: cambiaUnidad ? (0, inventario_unidades_1.unidadCanonica)(dto.unidad) : undefined,
                    costo: dto.costo,
                    costoReferencia: dto.costo !== undefined ? dto.costo : undefined,
                    precio: dto.precio === undefined ? undefined : dto.precio,
                    stockMin: dto.stock_min,
                    stockMax: dto.stock_max === undefined ? undefined : dto.stock_max,
                    estado: dto.estado,
                    idProveedor: dto.id_proveedor === undefined ? undefined : dto.id_proveedor,
                    idUbicacion: dto.id_ubicacion === undefined ? undefined : dto.id_ubicacion,
                    idResponsable: dto.id_responsable === undefined ? undefined : dto.id_responsable,
                    codigoBarras: dto.codigo_barras === undefined
                        ? undefined
                        : dto.codigo_barras?.trim() || null,
                    codigoQr: dto.codigo_qr === undefined
                        ? undefined
                        : dto.codigo_qr?.trim() || null,
                    numeroSerie: dto.numero_serie === undefined
                        ? undefined
                        : dto.numero_serie?.trim() || null,
                    fechaCompra: dto.fecha_compra === undefined
                        ? undefined
                        : dto.fecha_compra
                            ? new Date(dto.fecha_compra)
                            : null,
                    fechaVencimiento: dto.fecha_vencimiento === undefined
                        ? undefined
                        : dto.fecha_vencimiento
                            ? new Date(dto.fecha_vencimiento)
                            : null,
                    observaciones: dto.observaciones === undefined
                        ? undefined
                        : dto.observaciones?.trim() || null,
                    idProducto: dto.id_producto === undefined ? undefined : dto.id_producto,
                },
                include: {
                    categoria: true,
                    ubicacion: true,
                    responsable: {
                        select: { idUsuario: true, nombre: true, apellido: true },
                    },
                    presentaciones: PRESENTACIONES_INCLUDE,
                },
            });
            if (r.idProducto != null) {
                await this.prisma.$transaction((tx) => (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, r.idProducto, tenantId));
            }
            (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
            let recetas_recalculadas = RECETAS_VACIAS;
            if (dto.costo !== undefined &&
                Number(dto.costo) !== Number(existing.costo)) {
                recetas_recalculadas = await this.recetasCosto.recalcularPorRecurso(id, tenantId);
                if (actor) {
                    const u = await this.prisma.usuario.findUnique({
                        where: { idUsuario: actor.idUsuario },
                        select: { nombre: true, apellido: true },
                    });
                    const fmt = (n) => `$${Math.round(n).toLocaleString('es-CO')}`;
                    const detalle = `Costo ${fmt(Number(existing.costo))} → ${fmt(Number(dto.costo))} por ${r.unidad}`;
                    await (0, stock_auditoria_1.registrarAuditoriaStock)(this.prisma, {
                        idRestaurante: tenantId,
                        accion: 'cambio_costo',
                        origen: 'inventario',
                        idReferencia: id,
                        nombre: r.nombre,
                        motivo: dto.motivo_costo?.trim()
                            ? `${detalle} · ${dto.motivo_costo.trim()}`
                            : detalle,
                        idUsuario: actor.idUsuario,
                        nombreUsuario: u ? `${u.nombre} ${u.apellido ?? ''}`.trim() : 'Administrador',
                    });
                }
            }
            return { ...this.mapRecurso(r), recetas_recalculadas };
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            throw new common_1.BadRequestException('No se pudo actualizar el recurso');
        }
    }
    async aplicarMovimientoTx(tx, idRecurso, tenantId, input) {
        const rec = await tx.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            include: { categoria: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(rec.categoria);
        const valid = (0, recurso_movimientos_1.validarMovimientoContraFlags)(input.tipo, flags);
        if (!valid.ok)
            throw new common_1.BadRequestException(valid.motivo);
        if (input.id_documento && !input.omitir_idempotencia) {
            const n = await tx.movimientoRecurso.count({
                where: { idDocumento: input.id_documento },
            });
            if (n > 0)
                return { skipped: true };
        }
        const delta = (0, recurso_movimientos_1.deltaStockMovimientoRecurso)(input.tipo, input.cantidad);
        const actual = this.qty(rec.stock);
        let nuevo = actual;
        if (flags.controla_stock && input.tipo !== 'transferencia') {
            nuevo = (0, inventario_unidades_1.redondearInventario)(actual + delta);
        }
        const abs = Math.abs(input.cantidad);
        const costoCompra = input.costo_unitario ?? (rec.costo != null ? Number(rec.costo) : null);
        const stockAntes = actual;
        const costoAntes = rec.costo != null ? Number(rec.costo) : 0;
        const costoPromedio = input.tipo === 'compra' && costoCompra != null
            ? (0, inventario_costo_1.calcularCostoPromedioPonderado)({
                stockAnterior: stockAntes,
                costoAnterior: costoAntes,
                qtyEntrada: abs,
                costoEntrada: costoCompra,
            })
            : null;
        await tx.movimientoRecurso.create({
            data: {
                idRecurso,
                tipo: input.tipo,
                cantidad: abs,
                costoUnitario: costoCompra,
                costoTotal: costoCompra != null ? abs * costoCompra : null,
                observacion: input.observacion ?? null,
                moduloOrigen: input.modulo_origen ?? 'recursos',
                idDocumento: input.id_documento ?? null,
                idPedido: input.id_pedido ?? null,
                idDetallePedido: input.id_detalle_pedido ?? null,
                idUsuario: input.id_usuario ?? null,
                idUbicacionOrigen: input.id_ubicacion_origen ?? null,
                idUbicacionDestino: input.id_ubicacion_destino ?? null,
            },
        });
        if (flags.controla_stock && input.tipo !== 'transferencia') {
            const estado = (0, recurso_comportamiento_1.estadoTrasStock)(nuevo, this.qty(rec.stockMin), input.tipo === 'baja'
                ? 'baja'
                : input.tipo === 'mantenimiento'
                    ? 'mantenimiento'
                    : rec.estado);
            await tx.recurso.update({
                where: { idRecurso },
                data: {
                    stock: nuevo,
                    estado: input.tipo === 'baja' ? 'baja' : estado,
                    ...(input.tipo === 'compra' && costoPromedio != null
                        ? { costo: costoPromedio }
                        : {}),
                },
            });
            if (rec.idProducto != null) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, rec.idProducto, tenantId);
            }
            const min = this.qty(rec.stockMin);
            if (nuevo < actual &&
                !flags.es_activo_fijo &&
                input.tipo !== 'baja' &&
                RANGO_NIVEL[nivelStock(nuevo, min)] > RANGO_NIVEL[nivelStock(actual, min)]) {
                this.programarAlertaStock(tenantId, idRecurso);
            }
        }
        else if (input.tipo === 'compra' && costoPromedio != null) {
            await tx.recurso.update({
                where: { idRecurso },
                data: { costo: costoPromedio },
            });
        }
        else if (input.tipo === 'baja' || input.tipo === 'mantenimiento') {
            await tx.recurso.update({
                where: { idRecurso },
                data: {
                    estado: input.tipo === 'baja' ? 'baja' : 'mantenimiento',
                },
            });
        }
        return {
            skipped: false,
            stock: nuevo,
            costo_revaluado: input.tipo === 'compra' && costoPromedio != null,
        };
    }
    async sumarStockVendibleSiVinculado(idProducto, cantidad, tenantId, idUsuario) {
        const rec = await this.prisma.recurso.findFirst({
            where: {
                idProducto,
                idRestaurante: tenantId,
                categoria: { puedeVenderse: true, controlaStock: true },
                estado: { not: 'baja' },
            },
        });
        if (!rec)
            return false;
        await this.prisma.$transaction(async (tx) => {
            await this.aplicarMovimientoTx(tx, rec.idRecurso, tenantId, {
                tipo: 'ajuste',
                cantidad,
                observacion: 'Ingreso rápido de vendible',
                modulo_origen: 'compras_internas',
                id_usuario: idUsuario,
            });
        });
        return true;
    }
    async registrarMovimiento(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        let tipo;
        if ((0, recurso_movimientos_1.esTipoMovimientoRecurso)(dto.tipo)) {
            tipo = dto.tipo;
        }
        else {
            tipo = (0, recurso_movimientos_1.tipoMovimientoDesdeInventarioLegacy)(dto.tipo);
        }
        if (!Number.isFinite(dto.cantidad) || dto.cantidad === 0) {
            throw new common_1.BadRequestException('Cantidad no válida');
        }
        let cantidad = dto.cantidad;
        let costoUnitario = dto.costo_unitario;
        let observacion = dto.observacion;
        let presentacion = null;
        if (dto.id_presentacion != null) {
            const p = await this.prisma.presentacionRecurso.findFirst({
                where: {
                    idPresentacion: dto.id_presentacion,
                    idRecurso: id,
                    recurso: { idRestaurante: tenantId },
                },
                include: { recurso: { select: { unidad: true, costoReferencia: true } } },
            });
            if (!p)
                throw new common_1.BadRequestException('Presentación no encontrada para este artículo');
            const factor = Number(p.factor);
            presentacion = {
                idPresentacion: p.idPresentacion,
                nombre: p.nombre,
                factor,
                predeterminada: p.predeterminada,
                sinReferencia: !(Number(p.recurso.costoReferencia ?? 0) > 0),
            };
            cantidad = (0, inventario_unidades_1.redondearInventario)(dto.cantidad * factor);
            if (dto.costo_unitario != null)
                costoUnitario = dto.costo_unitario / factor;
            const detalle = `${dto.cantidad} × ${p.nombre} (${factor} ${p.recurso.unidad} c/u)`;
            observacion = observacion?.trim() ? `${detalle} · ${observacion.trim()}` : detalle;
        }
        const fijarPrecio = tipo === 'compra' && costoUnitario != null && costoUnitario > 0 && dto.fijar_precio !== false;
        await this.prisma.$transaction(async (tx) => {
            if (presentacion && fijarPrecio && dto.costo_unitario != null) {
                await tx.presentacionRecurso.update({
                    where: { idPresentacion: presentacion.idPresentacion },
                    data: { costoUltimo: dto.costo_unitario },
                });
            }
            const fijarReferencia = fijarPrecio &&
                (!presentacion || presentacion.predeterminada || presentacion.sinReferencia);
            if (fijarReferencia) {
                await tx.recurso.update({
                    where: { idRecurso: id },
                    data: { costoReferencia: costoUnitario },
                });
            }
            await this.aplicarMovimientoTx(tx, id, tenantId, {
                tipo,
                cantidad,
                costo_unitario: costoUnitario,
                observacion,
                id_ubicacion_origen: dto.id_ubicacion_origen,
                id_ubicacion_destino: dto.id_ubicacion_destino,
                id_usuario: idUsuario,
                modulo_origen: 'recursos',
            });
        });
        let recetas_recalculadas = RECETAS_VACIAS;
        if (tipo === 'compra') {
            recetas_recalculadas = await this.recetasCosto.recalcularPorRecurso(id, tenantId);
        }
        const recurso = await this.obtenerRecurso(id, tenantId);
        return { ...recurso, recetas_recalculadas };
    }
    async recursosParaCompra(ids, tenantId) {
        const rows = await this.prisma.recurso.findMany({
            where: { idRecurso: { in: ids }, idRestaurante: tenantId },
            select: {
                idRecurso: true,
                nombre: true,
                presentaciones: { select: { idPresentacion: true } },
            },
        });
        return new Map(rows.map((r) => [
            r.idRecurso,
            { nombre: r.nombre, presentaciones: r.presentaciones.map((p) => p.idPresentacion) },
        ]));
    }
    async lineasRecetaConUnidad(idRecurso, unidad) {
        const lineas = await this.prisma.recetaLinea.findMany({
            where: { idRecurso },
            select: {
                idLinea: true,
                unidad: true,
                receta: { select: { producto: { select: { nombre: true } } } },
            },
        });
        const key = (0, inventario_unidades_1.normalizarUnidad)(unidad);
        return lineas.filter((l) => (0, inventario_unidades_1.normalizarUnidad)(l.unidad) === key);
    }
    async crearPresentacion(idRecurso, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            include: { presentaciones: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const nombre = dto.nombre.trim();
        this.validarNombrePresentacion(nombre, rec.unidad);
        if (rec.presentaciones.some((p) => (0, inventario_unidades_1.normalizarUnidad)(p.nombre) === (0, inventario_unidades_1.normalizarUnidad)(nombre))) {
            throw new common_1.BadRequestException(`Ya existe la presentación «${nombre}»`);
        }
        const predeterminada = Boolean(dto.predeterminada) || rec.presentaciones.length === 0;
        await this.prisma.$transaction(async (tx) => {
            if (predeterminada) {
                await tx.presentacionRecurso.updateMany({
                    where: { idRecurso },
                    data: { predeterminada: false },
                });
            }
            await tx.presentacionRecurso.create({
                data: {
                    idRecurso,
                    nombre,
                    factor: dto.factor,
                    codigoBarras: dto.codigo_barras?.trim() || null,
                    costoUltimo: dto.costo_ultimo != null && dto.costo_ultimo > 0 ? dto.costo_ultimo : null,
                    predeterminada,
                },
            });
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return this.obtenerRecurso(idRecurso, tenantId);
    }
    async actualizarPresentacion(idRecurso, idPresentacion, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            include: { presentaciones: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const actual = rec.presentaciones.find((p) => p.idPresentacion === idPresentacion);
        if (!actual)
            throw new common_1.NotFoundException('Presentación no encontrada');
        const nombre = dto.nombre?.trim();
        const renombra = nombre != null && (0, inventario_unidades_1.normalizarUnidad)(nombre) !== (0, inventario_unidades_1.normalizarUnidad)(actual.nombre);
        if (renombra) {
            this.validarNombrePresentacion(nombre, rec.unidad);
            if (rec.presentaciones.some((p) => p.idPresentacion !== idPresentacion &&
                (0, inventario_unidades_1.normalizarUnidad)(p.nombre) === (0, inventario_unidades_1.normalizarUnidad)(nombre))) {
                throw new common_1.BadRequestException(`Ya existe la presentación «${nombre}»`);
            }
        }
        const lineasARenombrar = renombra
            ? await this.lineasRecetaConUnidad(idRecurso, actual.nombre)
            : [];
        const cambiaFactor = dto.factor != null && dto.factor !== Number(actual.factor);
        await this.prisma.$transaction(async (tx) => {
            if (dto.predeterminada) {
                await tx.presentacionRecurso.updateMany({
                    where: { idRecurso },
                    data: { predeterminada: false },
                });
            }
            await tx.presentacionRecurso.update({
                where: { idPresentacion },
                data: {
                    nombre: renombra ? nombre : undefined,
                    factor: dto.factor,
                    codigoBarras: dto.codigo_barras === undefined ? undefined : dto.codigo_barras.trim() || null,
                    costoUltimo: dto.costo_ultimo === undefined
                        ? undefined
                        : dto.costo_ultimo != null && dto.costo_ultimo > 0
                            ? dto.costo_ultimo
                            : null,
                    predeterminada: dto.predeterminada ? true : undefined,
                },
            });
            if (lineasARenombrar.length) {
                await tx.recetaLinea.updateMany({
                    where: { idLinea: { in: lineasARenombrar.map((l) => l.idLinea) } },
                    data: { unidad: nombre },
                });
            }
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        if (cambiaFactor) {
            const usadas = await this.lineasRecetaConUnidad(idRecurso, renombra ? nombre : actual.nombre);
            if (usadas.length)
                await this.recetasCosto.recalcularPorRecurso(idRecurso, tenantId);
        }
        return this.obtenerRecurso(idRecurso, tenantId);
    }
    async eliminarPresentacion(idRecurso, idPresentacion, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const p = await this.prisma.presentacionRecurso.findFirst({
            where: { idPresentacion, idRecurso, recurso: { idRestaurante: tenantId } },
        });
        if (!p)
            throw new common_1.NotFoundException('Presentación no encontrada');
        const usadas = await this.lineasRecetaConUnidad(idRecurso, p.nombre);
        if (usadas.length) {
            const productos = [
                ...new Set(usadas.map((l) => l.receta.producto?.nombre).filter(Boolean)),
            ].join(', ');
            throw new common_1.BadRequestException(`La receta de ${productos || 'algunos productos'} usa «${p.nombre}». Cambia esa línea a otra unidad antes de quitarla.`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.presentacionRecurso.delete({ where: { idPresentacion } });
            if (p.predeterminada) {
                const siguiente = await tx.presentacionRecurso.findFirst({
                    where: { idRecurso },
                    orderBy: { factor: 'asc' },
                });
                if (siguiente) {
                    await tx.presentacionRecurso.update({
                        where: { idPresentacion: siguiente.idPresentacion },
                        data: { predeterminada: true },
                    });
                }
            }
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return this.obtenerRecurso(idRecurso, tenantId);
    }
    async convertirUnidad(idRecurso, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, actor) {
        const nombreAdmin = await (0, stock_auditoria_1.exigirPasswordAdmin)(this.prisma, actor, dto.password_admin, 'convertir la unidad del artículo');
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            include: { presentaciones: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        this.validarUnidadRecurso(dto.unidad_base);
        const nuevaUnidad = (0, inventario_unidades_1.unidadCanonica)(dto.unidad_base);
        if ((0, inventario_unidades_1.normalizarUnidad)(nuevaUnidad) === (0, inventario_unidades_1.normalizarUnidad)(rec.unidad)) {
            throw new common_1.BadRequestException('La unidad nueva es igual a la actual');
        }
        const f = dto.factor;
        const nombrePres = dto.nombre_presentacion?.trim() ||
            rec.unidad.trim().charAt(0).toUpperCase() + rec.unidad.trim().slice(1);
        this.validarNombrePresentacion(nombrePres, nuevaUnidad);
        const lineasUnidadVieja = await this.lineasRecetaConUnidad(idRecurso, rec.unidad);
        const stockAntes = this.qty(rec.stock);
        const stockNuevo = (0, inventario_unidades_1.redondearInventario)(stockAntes * f);
        await this.prisma.$transaction(async (tx) => {
            await tx.recurso.update({
                where: { idRecurso },
                data: {
                    unidad: nuevaUnidad,
                    stock: stockNuevo,
                    stockMin: (0, inventario_unidades_1.redondearInventario)(this.qty(rec.stockMin) * f),
                    stockMax: rec.stockMax != null ? (0, inventario_unidades_1.redondearInventario)(this.qty(rec.stockMax) * f) : null,
                    costo: Number(rec.costo) / f,
                    costoReferencia: rec.costoReferencia != null ? Number(rec.costoReferencia) / f : null,
                },
            });
            await tx.movimientoRecurso.updateMany({
                where: { idRecurso },
                data: { cantidad: { multiply: f }, costoUnitario: { divide: f } },
            });
            for (const p of rec.presentaciones) {
                await tx.presentacionRecurso.update({
                    where: { idPresentacion: p.idPresentacion },
                    data: { factor: Number(p.factor) * f },
                });
            }
            const yaExiste = rec.presentaciones.some((p) => (0, inventario_unidades_1.normalizarUnidad)(p.nombre) === (0, inventario_unidades_1.normalizarUnidad)(nombrePres));
            if (!yaExiste) {
                await tx.presentacionRecurso.updateMany({
                    where: { idRecurso },
                    data: { predeterminada: false },
                });
                await tx.presentacionRecurso.create({
                    data: { idRecurso, nombre: nombrePres, factor: f, predeterminada: true },
                });
            }
            if (lineasUnidadVieja.length &&
                (0, inventario_unidades_1.normalizarUnidad)(nombrePres) !== (0, inventario_unidades_1.normalizarUnidad)(rec.unidad)) {
                await tx.recetaLinea.updateMany({
                    where: { idLinea: { in: lineasUnidadVieja.map((l) => l.idLinea) } },
                    data: { unidad: nombrePres },
                });
            }
            if (rec.idProducto != null) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, rec.idProducto, tenantId);
            }
            await (0, stock_auditoria_1.registrarAuditoriaStock)(tx, {
                idRestaurante: tenantId,
                accion: 'cambio_unidad',
                origen: 'inventario',
                idReferencia: idRecurso,
                nombre: rec.nombre,
                stockAnterior: stockAntes,
                stockNuevo,
                motivo: `Unidad ${rec.unidad} → ${nuevaUnidad} (1 ${rec.unidad} = ${f} ${nuevaUnidad})`,
                idUsuario: actor.idUsuario,
                nombreUsuario: nombreAdmin,
            });
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        const recetas_recalculadas = await this.recetasCosto.recalcularPorRecurso(idRecurso, tenantId);
        const recurso = await this.obtenerRecurso(idRecurso, tenantId);
        return { ...recurso, recetas_recalculadas };
    }
    async aplicarMovimientoDeduccionTx(tx, input) {
        return this.aplicarMovimientoTx(tx, input.id_recurso, input.tenant_id, {
            tipo: input.tipo,
            cantidad: input.cantidad,
            costo_unitario: input.costo_unitario,
            observacion: input.observacion,
            modulo_origen: input.modulo_origen,
            id_documento: input.id_documento,
            omitir_idempotencia: true,
            id_usuario: input.id_usuario,
            id_pedido: input.id_pedido,
            id_detalle_pedido: input.id_detalle_pedido,
        });
    }
    async listarAuditoriaStock(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, limite = 100) {
        const rows = await this.prisma.auditoriaStock.findMany({
            where: { idRestaurante: tenantId },
            orderBy: { creadoEn: 'desc' },
            take: Math.min(Math.max(1, limite || 100), 500),
        });
        return rows.map((r) => ({
            id: r.idAuditoria,
            accion: r.accion,
            origen: r.origen,
            id_referencia: r.idReferencia,
            nombre: r.nombre,
            stock_anterior: r.stockAnterior != null ? Number(r.stockAnterior) : null,
            stock_nuevo: r.stockNuevo != null ? Number(r.stockNuevo) : null,
            motivo: r.motivo,
            usuario: r.nombreUsuario,
            creado_en: r.creadoEn.toISOString(),
        }));
    }
    async listarMovimientos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, filtros) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.movimientoRecurso.findMany({
            where: {
                recurso: { idRestaurante: tenantId },
                ...(filtros?.id_recurso != null
                    ? { idRecurso: filtros.id_recurso }
                    : {}),
            },
            include: {
                recurso: { select: { idRecurso: true, nombre: true, codigo: true } },
                usuario: { select: { idUsuario: true, nombre: true, apellido: true } },
            },
            orderBy: { fecha: 'desc' },
            take: filtros?.limite ?? 100,
        });
        return rows.map((m) => ({
            id_movimiento: m.idMovimiento,
            id_recurso: m.idRecurso,
            recurso_nombre: m.recurso.nombre,
            recurso_codigo: m.recurso.codigo,
            tipo: m.tipo,
            cantidad: this.qty(m.cantidad),
            costo_unitario: m.costoUnitario != null ? Number(m.costoUnitario) : null,
            costo_total: m.costoTotal != null ? Number(m.costoTotal) : null,
            observacion: m.observacion,
            modulo_origen: m.moduloOrigen,
            id_documento: m.idDocumento,
            id_pedido: m.idPedido,
            fecha: m.fecha.toISOString(),
            usuario: m.usuario
                ? {
                    id_usuario: m.usuario.idUsuario,
                    nombre: `${m.usuario.nombre} ${m.usuario.apellido}`.trim(),
                }
                : null,
        }));
    }
    async registrarMantenimiento(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
            include: { categoria: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        if (!rec.categoria.requiereMantenimiento && !rec.categoria.esActivoFijo) {
            throw new common_1.BadRequestException('Esta categoría no registra mantenimiento');
        }
        const m = await this.prisma.$transaction(async (tx) => {
            const row = await tx.mantenimientoRecurso.create({
                data: {
                    idRecurso: id,
                    descripcion: dto.descripcion.trim(),
                    costo: dto.costo ?? null,
                    fecha: dto.fecha ? new Date(dto.fecha) : undefined,
                    idUsuario: idUsuario ?? null,
                },
            });
            await tx.recurso.update({
                where: { idRecurso: id },
                data: { estado: 'mantenimiento' },
            });
            await this.aplicarMovimientoTx(tx, id, tenantId, {
                tipo: 'mantenimiento',
                cantidad: 0,
                observacion: dto.descripcion.trim(),
                costo_unitario: dto.costo,
                id_usuario: idUsuario,
                modulo_origen: 'recursos',
                id_documento: `mant:${row.idMantenimiento}`,
            });
            return row;
        });
        return {
            id_mantenimiento: m.idMantenimiento,
            id_recurso: m.idRecurso,
            fecha: m.fecha.toISOString(),
            descripcion: m.descripcion,
            costo: m.costo != null ? Number(m.costo) : null,
        };
    }
    async listarMantenimientos(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const rows = await this.prisma.mantenimientoRecurso.findMany({
            where: { idRecurso: id },
            orderBy: { fecha: 'desc' },
            include: {
                usuario: { select: { idUsuario: true, nombre: true, apellido: true } },
            },
        });
        return rows.map((m) => ({
            id_mantenimiento: m.idMantenimiento,
            fecha: m.fecha.toISOString(),
            descripcion: m.descripcion,
            costo: m.costo != null ? Number(m.costo) : null,
            usuario: m.usuario
                ? {
                    id_usuario: m.usuario.idUsuario,
                    nombre: `${m.usuario.nombre} ${m.usuario.apellido}`.trim(),
                }
                : null,
        }));
    }
    async dashboard(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.migrarSiNecesario(tenantId);
        const recursos = await this.prisma.recurso.findMany({
            where: { idRestaurante: tenantId },
            include: { categoria: true },
        });
        const mapped = recursos.map((r) => this.mapRecurso(r));
        const ahora = new Date();
        const en30 = new Date(ahora);
        en30.setDate(en30.getDate() + 30);
        const criticos = mapped.filter((r) => r.critico);
        const agotados = mapped.filter((r) => r.estado === 'agotado');
        const mantenimiento = mapped.filter((r) => r.estado === 'mantenimiento');
        const baja = mapped.filter((r) => r.estado === 'baja');
        const porVencer = mapped.filter((r) => {
            if (!r.fecha_vencimiento)
                return false;
            const d = new Date(r.fecha_vencimiento);
            return d >= ahora && d <= en30;
        });
        let valorStock = 0;
        let valorActivos = 0;
        for (const r of mapped) {
            const val = r.stock * r.costo;
            if (r.categoria?.es_activo_fijo)
                valorActivos += val;
            else if (r.categoria?.controla_stock)
                valorStock += val;
        }
        const recientes = await this.listarMovimientos(tenantId, { limite: 15 });
        return {
            totales: {
                recursos: mapped.length,
                criticos: criticos.length,
                agotados: agotados.length,
                mantenimiento: mantenimiento.length,
                baja: baja.length,
                por_vencer: porVencer.length,
                valor_stock: Math.round(valorStock * 100) / 100,
                valor_activos: Math.round(valorActivos * 100) / 100,
            },
            criticos: criticos.slice(0, 20),
            agotados: agotados.slice(0, 20),
            mantenimiento: mantenimiento.slice(0, 20),
            por_vencer: porVencer.slice(0, 20),
            movimientos_recientes: recientes,
        };
    }
    migrarDesdeInventario(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.migracion.migrarDesdeInventario(tenantId);
    }
};
exports.RecursosService = RecursosService;
exports.RecursosService = RecursosService = RecursosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => inventario_receta_service_1.InventarioRecetaService))),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => pedidos_gateway_1.PedidosGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        recursos_migracion_service_1.RecursosMigracionService,
        inventario_receta_service_1.InventarioRecetaService,
        pedidos_gateway_1.PedidosGateway])
], RecursosService);
//# sourceMappingURL=recursos.service.js.map