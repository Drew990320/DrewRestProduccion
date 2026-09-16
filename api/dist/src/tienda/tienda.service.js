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
exports.TiendaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const mesa_label_1 = require("@drewrest/shared-domain/mesa-label");
const tienda_1 = require("@drewrest/shared-domain/tienda");
const pedidos_service_1 = require("../pedidos/pedidos.service");
function mapTienda(t) {
    return {
        id_tienda: t.idTienda,
        nombre: t.nombre,
        etiqueta: t.etiqueta ?? t.nombre,
        activo: t.activo,
        numero_mesa_boutique: t.numeroMesaBoutique,
        orden: t.orden,
    };
}
function mapCategoria(c) {
    return {
        id_categoria: c.idCategoria,
        id_tienda: c.idTienda,
        nombre: c.nombre,
        activo: c.activo,
        canal: c.canal,
        total_productos: c._count?.productos,
    };
}
function mapVariante(v) {
    return {
        id_variante: v.idVariante,
        id_producto: v.idProducto,
        nombre: v.nombre,
        etiqueta_grupo: v.etiquetaGrupo,
        precio: Number(v.precio),
        stock_disponible: v.stockDisponible,
        activo: v.activo,
        orden: v.orden,
    };
}
function mapProducto(p) {
    return {
        id_producto: p.idProducto,
        id_categoria: p.idCategoria,
        id_tienda: p.categoria.idTienda,
        categoria_nombre: p.categoria.nombre,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        activo: p.activo,
        control_stock: p.controlStock,
        stock_disponible: p.stockDisponible,
        ocultar_sin_stock: p.ocultarSinStock,
        variantes: (p.variantes ?? []).map(mapVariante),
    };
}
let TiendaService = class TiendaService {
    prisma;
    pedidos;
    constructor(prisma, pedidos) {
        this.prisma = prisma;
        this.pedidos = pedidos;
    }
    async resolveTiendaId(tenantId, idTienda) {
        const tiendas = await this.prisma.tienda.findMany({
            where: { idRestaurante: tenantId, activo: true },
            orderBy: [{ orden: 'asc' }, { idTienda: 'asc' }],
            select: { idTienda: true },
        });
        if (tiendas.length === 0) {
            const created = await this.ensureDefaultTienda(tenantId);
            return created.idTienda;
        }
        if (idTienda != null) {
            const hit = tiendas.find((t) => t.idTienda === idTienda);
            if (!hit) {
                const any = await this.prisma.tienda.findFirst({
                    where: { idTienda, idRestaurante: tenantId },
                });
                if (!any)
                    throw new common_1.NotFoundException('Tienda no encontrada');
                if (!any.activo)
                    throw new common_1.BadRequestException('Tienda inactiva');
                return any.idTienda;
            }
            return hit.idTienda;
        }
        if (tiendas.length === 1)
            return tiendas[0].idTienda;
        throw new common_1.BadRequestException('Debes indicar id_tienda (hay más de una tienda activa)');
    }
    async listarTiendas(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.ensureDefaultTienda(tenantId);
        const rows = await this.prisma.tienda.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ orden: 'asc' }, { idTienda: 'asc' }],
        });
        return rows.map(mapTienda);
    }
    async crearTienda(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const checked = (0, tienda_1.validarNombreTienda)(dto.nombre);
        if (!checked.ok)
            throw new common_1.BadRequestException(checked.mensaje);
        const nombre = checked.nombre;
        const numero = await this.asignarNumeroMesaBoutiqueLibre(tenantId);
        try {
            const created = await this.prisma.tienda.create({
                data: {
                    idRestaurante: tenantId,
                    nombre,
                    etiqueta: dto.etiqueta?.trim() || nombre,
                    activo: true,
                    numeroMesaBoutique: numero,
                    orden: await this.nextOrden(tenantId),
                },
            });
            await this.ensureMesaBoutique(tenantId, created.idTienda);
            return mapTienda(created);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.BadRequestException('Ya existe una tienda con ese nombre');
            }
            throw e;
        }
    }
    async actualizarTienda(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.tienda.findFirst({
            where: { idTienda: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Tienda no encontrada');
        try {
            const updated = await this.prisma.tienda.update({
                where: { idTienda: id },
                data: {
                    ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                    ...(dto.etiqueta !== undefined
                        ? { etiqueta: dto.etiqueta?.trim() || null }
                        : {}),
                    ...(dto.activo != null ? { activo: dto.activo } : {}),
                },
            });
            return mapTienda(updated);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.BadRequestException('Ya existe una tienda con ese nombre');
            }
            throw e;
        }
    }
    async ensureDefaultTienda(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.tienda.findFirst({
            where: { idRestaurante: tenantId },
            orderBy: [{ orden: 'asc' }, { idTienda: 'asc' }],
        });
        if (existing) {
            await this.ensureMesaBoutique(tenantId, existing.idTienda);
            return existing;
        }
        const op = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
        });
        const mv = (0, mesa_label_1.resolverMesasVirtuales)(op);
        const nombre = mv.etiqueta_boutique || 'Tienda';
        const created = await this.prisma.tienda.create({
            data: {
                idRestaurante: tenantId,
                nombre,
                etiqueta: nombre,
                activo: true,
                numeroMesaBoutique: mv.numero_mesa_boutique,
                orden: 0,
            },
        });
        await this.ensureMesaBoutique(tenantId, created.idTienda);
        await this.prisma.categoria.updateMany({
            where: {
                idRestaurante: tenantId,
                canal: 'retail',
                idTienda: null,
            },
            data: { idTienda: created.idTienda },
        });
        return created;
    }
    async nextOrden(tenantId) {
        const agg = await this.prisma.tienda.aggregate({
            where: { idRestaurante: tenantId },
            _max: { orden: true },
        });
        return (agg._max.orden ?? -1) + 1;
    }
    async asignarNumeroMesaBoutiqueLibre(tenantId) {
        const usados = new Set([
            mesa_label_1.MESA_PARA_LLEVAR_NUMERO,
            mesa_label_1.MESA_MOSTRADOR_NUMERO,
        ]);
        const mesas = await this.prisma.mesa.findMany({
            where: { idRestaurante: tenantId },
            select: { numero: true },
        });
        for (const m of mesas)
            usados.add(m.numero);
        const tiendas = await this.prisma.tienda.findMany({
            where: { idRestaurante: tenantId },
            select: { numeroMesaBoutique: true },
        });
        for (const t of tiendas)
            usados.add(t.numeroMesaBoutique);
        for (let n = mesa_label_1.MESA_BOUTIQUE_NUMERO; n >= 80; n--) {
            if (n === mesa_label_1.MESA_PARA_LLEVAR_NUMERO || n === mesa_label_1.MESA_MOSTRADOR_NUMERO)
                continue;
            if (!usados.has(n))
                return n;
        }
        for (let n = 70; n >= 50; n--) {
            if (!usados.has(n))
                return n;
        }
        throw new common_1.BadRequestException('No hay número de mesa boutique libre; libera una mesa virtual');
    }
    async listarCategorias(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const rows = await this.prisma.categoria.findMany({
            where: { idRestaurante: tenantId, canal: 'retail', idTienda: tid },
            include: { _count: { select: { productos: true } } },
            orderBy: { nombre: 'asc' },
        });
        return rows.map(mapCategoria);
    }
    async crearCategoria(nombre, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const n = nombre.trim();
        if (!n)
            throw new common_1.BadRequestException('Nombre requerido');
        try {
            const created = await this.prisma.categoria.create({
                data: {
                    idRestaurante: tenantId,
                    idTienda: tid,
                    nombre: n,
                    canal: 'retail',
                    activo: true,
                    esBebida: false,
                    visibleEnMostrador: false,
                },
                include: { _count: { select: { productos: true } } },
            });
            return mapCategoria(created);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.BadRequestException('Ya existe esa categoría en tienda');
            }
            throw e;
        }
    }
    async actualizarCategoria(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const existing = await this.prisma.categoria.findFirst({
            where: {
                idCategoria: id,
                idRestaurante: tenantId,
                canal: 'retail',
                idTienda: tid,
            },
        });
        if (!existing)
            throw new common_1.NotFoundException('Categoría no encontrada');
        try {
            const updated = await this.prisma.categoria.update({
                where: { idCategoria: id },
                data: {
                    ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                    ...(dto.activo != null ? { activo: dto.activo } : {}),
                },
                include: { _count: { select: { productos: true } } },
            });
            return mapCategoria(updated);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.BadRequestException('Ya existe esa categoría en tienda');
            }
            throw e;
        }
    }
    async listarProductos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const rows = await this.prisma.producto.findMany({
            where: {
                categoria: { idRestaurante: tenantId, canal: 'retail', idTienda: tid },
            },
            include: {
                categoria: { select: { nombre: true, idTienda: true } },
                variantes: { orderBy: [{ orden: 'asc' }, { idVariante: 'asc' }] },
            },
            orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
        });
        return rows.map(mapProducto);
    }
    async crearProducto(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const cat = await this.prisma.categoria.findFirst({
            where: {
                idCategoria: dto.id_categoria,
                idRestaurante: tenantId,
                canal: 'retail',
                idTienda: tid,
            },
        });
        if (!cat)
            throw new common_1.BadRequestException('Categoría de tienda no encontrada');
        const created = await this.prisma.producto.create({
            data: {
                idCategoria: dto.id_categoria,
                nombre: dto.nombre.trim(),
                descripcion: dto.descripcion?.trim() || null,
                precio: dto.precio,
                activo: true,
                esPlatoPrincipal: false,
                esEmpacable: false,
                enviaCocina: false,
                controlStock: dto.control_stock ?? true,
                stockDisponible: Math.max(0, Math.round(dto.stock_disponible ?? 0)),
                ocultarSinStock: true,
            },
            include: {
                categoria: { select: { nombre: true, idTienda: true } },
                variantes: true,
            },
        });
        return mapProducto(created);
    }
    async actualizarProducto(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const existing = await this.prisma.producto.findFirst({
            where: {
                idProducto: id,
                categoria: { idRestaurante: tenantId, canal: 'retail', idTienda: tid },
            },
        });
        if (!existing)
            throw new common_1.NotFoundException('Producto no encontrado');
        if (dto.id_categoria != null) {
            const cat = await this.prisma.categoria.findFirst({
                where: {
                    idCategoria: dto.id_categoria,
                    idRestaurante: tenantId,
                    canal: 'retail',
                    idTienda: tid,
                },
            });
            if (!cat)
                throw new common_1.BadRequestException('Categoría de tienda no encontrada');
        }
        const updated = await this.prisma.producto.update({
            where: { idProducto: id },
            data: {
                ...(dto.id_categoria != null ? { idCategoria: dto.id_categoria } : {}),
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.precio != null ? { precio: dto.precio } : {}),
                ...(dto.descripcion !== undefined
                    ? { descripcion: dto.descripcion?.trim() || null }
                    : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
                ...(dto.control_stock != null ? { controlStock: dto.control_stock } : {}),
                ...(dto.stock_disponible != null
                    ? { stockDisponible: Math.max(0, Math.round(dto.stock_disponible)) }
                    : {}),
            },
            include: {
                categoria: { select: { nombre: true, idTienda: true } },
                variantes: { orderBy: [{ orden: 'asc' }, { idVariante: 'asc' }] },
            },
        });
        return mapProducto(updated);
    }
    async upsertVariante(idProducto, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto,
                categoria: { idRestaurante: tenantId, canal: 'retail', idTienda: tid },
            },
        });
        if (!producto)
            throw new common_1.NotFoundException('Producto no encontrado');
        const nombre = dto.nombre.trim();
        if (!nombre)
            throw new common_1.BadRequestException('Nombre de variante requerido');
        if (dto.id_variante) {
            const existing = await this.prisma.productoVariante.findFirst({
                where: { idVariante: dto.id_variante, idProducto },
            });
            if (!existing)
                throw new common_1.NotFoundException('Variante no encontrada');
            const updated = await this.prisma.productoVariante.update({
                where: { idVariante: dto.id_variante },
                data: {
                    nombre,
                    etiquetaGrupo: dto.etiqueta_grupo?.trim() || null,
                    precio: dto.precio,
                    ...(dto.stock_disponible != null
                        ? { stockDisponible: Math.max(0, Math.round(dto.stock_disponible)) }
                        : {}),
                    ...(dto.activo != null ? { activo: dto.activo } : {}),
                    ...(dto.orden != null ? { orden: dto.orden } : {}),
                },
            });
            return mapVariante(updated);
        }
        try {
            const created = await this.prisma.productoVariante.create({
                data: {
                    idProducto,
                    nombre,
                    etiquetaGrupo: dto.etiqueta_grupo?.trim() || null,
                    precio: dto.precio,
                    stockDisponible: Math.max(0, Math.round(dto.stock_disponible ?? 0)),
                    activo: dto.activo !== false,
                    orden: dto.orden ?? 0,
                },
            });
            return mapVariante(created);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.BadRequestException('Ya existe una variante con ese nombre');
            }
            throw e;
        }
    }
    async eliminarVariante(idProducto, idVariante, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto,
                categoria: { idRestaurante: tenantId, canal: 'retail', idTienda: tid },
            },
        });
        if (!producto)
            throw new common_1.NotFoundException('Producto no encontrado');
        await this.prisma.productoVariante.deleteMany({
            where: { idVariante, idProducto },
        });
        return { ok: true };
    }
    async catalogoVenta(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const categorias = await this.prisma.categoria.findMany({
            where: {
                idRestaurante: tenantId,
                canal: 'retail',
                idTienda: tid,
                activo: true,
            },
            include: {
                productos: {
                    where: { activo: true },
                    include: {
                        variantes: {
                            where: { activo: true },
                            orderBy: [{ orden: 'asc' }, { idVariante: 'asc' }],
                        },
                    },
                    orderBy: { nombre: 'asc' },
                },
            },
            orderBy: { nombre: 'asc' },
        });
        return {
            id_tienda: tid,
            categorias: categorias
                .map((c) => ({
                id_categoria: c.idCategoria,
                nombre: c.nombre,
                productos: c.productos
                    .filter((p) => {
                    if (p.variantes.length > 0) {
                        return p.variantes.some((v) => !p.controlStock || v.stockDisponible > 0 || !p.ocultarSinStock);
                    }
                    if (!p.controlStock)
                        return true;
                    if (p.stockDisponible > 0)
                        return true;
                    return !p.ocultarSinStock;
                })
                    .map((p) => ({
                    id_producto: p.idProducto,
                    nombre: p.nombre,
                    descripcion: p.descripcion,
                    precio: Number(p.precio),
                    control_stock: p.controlStock,
                    stock_disponible: p.stockDisponible,
                    agotado: p.controlStock &&
                        (p.variantes.length > 0
                            ? p.variantes.every((v) => v.stockDisponible <= 0)
                            : p.stockDisponible <= 0),
                    variantes: p.variantes.map((v) => ({
                        id_variante: v.idVariante,
                        nombre: v.nombre,
                        etiqueta_grupo: v.etiquetaGrupo,
                        precio: Number(v.precio),
                        stock_disponible: v.stockDisponible,
                        agotado: p.controlStock && v.stockDisponible <= 0,
                    })),
                })),
            }))
                .filter((c) => c.productos.length > 0),
        };
    }
    async ensureMesaBoutique(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        let tienda = await this.prisma.tienda.findFirst({
            where: { idTienda: tid, idRestaurante: tenantId },
        });
        if (!tienda)
            throw new common_1.NotFoundException('Tienda no encontrada');
        let mesa = await this.prisma.mesa.findFirst({
            where: { idRestaurante: tenantId, numero: tienda.numeroMesaBoutique },
        });
        const puedeReclamar = mesa != null &&
            mesa.idLugar == null &&
            (mesa.idTienda == null || mesa.idTienda === tid);
        if (mesa && !puedeReclamar) {
            const nuevo = await this.asignarNumeroMesaBoutiqueLibre(tenantId);
            tienda = await this.prisma.tienda.update({
                where: { idTienda: tid },
                data: { numeroMesaBoutique: nuevo },
            });
            mesa = null;
        }
        if (!mesa) {
            mesa = await this.prisma.mesa.create({
                data: {
                    idRestaurante: tenantId,
                    idTienda: tid,
                    numero: tienda.numeroMesaBoutique,
                    capacidad: 1,
                    estado: 'libre',
                    disponibleLunes: true,
                    disponibleMartes: true,
                    disponibleMiercoles: true,
                    disponibleJueves: true,
                    disponibleViernes: true,
                    disponibleSabado: true,
                    disponibleDomingo: true,
                },
            });
        }
        else if (mesa.idTienda !== tid) {
            mesa = await this.prisma.mesa.update({
                where: { idMesa: mesa.idMesa },
                data: { idTienda: tid },
            });
        }
        const op = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
        });
        const extras = (await this.prisma.tienda.findMany({
            where: { idRestaurante: tenantId },
            select: { numeroMesaBoutique: true },
        })).map((t) => t.numeroMesaBoutique);
        if (!(0, mesa_label_1.esMesaBoutiqueNumero)(mesa.numero, op, extras)) {
            throw new common_1.BadRequestException('Mesa boutique mal configurada');
        }
        return mesa;
    }
    async listarVentasAbiertas(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const mesa = await this.ensureMesaBoutique(tenantId, tid);
        return this.pedidos.pedidosActivosPorMesa(mesa.idMesa, tenantId);
    }
    async abrirVenta(actor, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idTienda) {
        const tid = await this.resolveTiendaId(tenantId, idTienda);
        const mesa = await this.ensureMesaBoutique(tenantId, tid);
        return this.pedidos.crear({ id_mesa: mesa.idMesa, num_comensales: 1 }, actor.idUsuario, tenantId);
    }
    async numerosBoutiqueTenant(tenantId) {
        const rows = await this.prisma.tienda.findMany({
            where: { idRestaurante: tenantId },
            select: { numeroMesaBoutique: true },
        });
        return rows.map((r) => r.numeroMesaBoutique);
    }
};
exports.TiendaService = TiendaService;
exports.TiendaService = TiendaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_service_1.PedidosService])
], TiendaService);
//# sourceMappingURL=tienda.service.js.map