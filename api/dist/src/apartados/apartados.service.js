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
exports.ApartadosService = void 0;
const common_1 = require("@nestjs/common");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const pedidos_service_1 = require("../pedidos/pedidos.service");
const permisos_service_1 = require("../permisos/permisos.service");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_retail_1 = require("../productos/stock-retail");
const servicios_service_1 = require("../servicios/servicios.service");
const tienda_service_1 = require("../tienda/tienda.service");
const apartadoInclude = {
    tienda: { select: { idTienda: true, nombre: true } },
    items: { orderBy: { idItem: 'asc' } },
    abonos: { orderBy: { idAbono: 'asc' } },
};
function fechaDb(iso) {
    return new Date(`${iso}T00:00:00.000Z`);
}
function redondo(v) {
    return Math.round(Number(v));
}
let ApartadosService = class ApartadosService {
    prisma;
    pedidos;
    gateway;
    servicios;
    tiendas;
    permisos;
    constructor(prisma, pedidos, gateway, servicios, tiendas, permisos) {
        this.prisma = prisma;
        this.pedidos = pedidos;
        this.gateway = gateway;
        this.servicios = servicios;
        this.tiendas = tiendas;
        this.permisos = permisos;
    }
    async listar(tenantId, q) {
        const estado = q.estado === 'entregado' || q.estado === 'cancelado' || q.estado === 'activo'
            ? q.estado
            : undefined;
        const base = {
            idRestaurante: tenantId,
            ...(q.idTienda != null ? { idTienda: q.idTienda } : {}),
        };
        const buscar = (where, take) => this.prisma.apartado.findMany({
            where: { ...base, ...where },
            include: apartadoInclude,
            orderBy: [{ creadoEn: 'desc' }],
            take,
        });
        if (estado) {
            return this.mapear(await buscar({ estado }, estado === 'activo' ? undefined : 200));
        }
        const [activos, cerrados] = await Promise.all([
            buscar({ estado: 'activo' }),
            buscar({ estado: { not: 'activo' } }, 200),
        ]);
        return this.mapear([...activos, ...cerrados]);
    }
    async obtener(id, tenantId) {
        return (await this.mapear([await this.obtenerRow(id, tenantId)]))[0];
    }
    async crear(dto, actor) {
        const tenantId = actor.idRestaurante;
        const idTienda = await this.tiendas.resolveTiendaId(tenantId, dto.id_tienda, {
            paraVender: true,
        });
        const ids = [...new Set(dto.items.map((i) => i.id_producto))];
        const productos = await this.prisma.producto.findMany({
            where: {
                idProducto: { in: ids },
                activo: true,
                categoria: { idRestaurante: tenantId, canal: 'retail', idTienda },
            },
            include: {
                categoria: { select: { canal: true } },
                variantes: { where: { activo: true } },
            },
        });
        const porId = new Map(productos.map((p) => [p.idProducto, p]));
        const lineas = dto.items.map((it) => {
            const p = porId.get(it.id_producto);
            if (!p)
                throw new common_1.BadRequestException('Un producto no está disponible en esta tienda');
            if (p.variantes.length > 0) {
                const v = p.variantes.find((x) => x.idVariante === it.id_variante);
                if (!v)
                    throw new common_1.BadRequestException(`Elige la variante de ${p.nombre}`);
                return {
                    producto: p,
                    idVariante: v.idVariante,
                    nombre: `${p.nombre} · ${v.nombre}`,
                    cantidad: it.cantidad,
                    precio: redondo(v.precio),
                };
            }
            if (it.id_variante != null) {
                throw new common_1.BadRequestException(`${p.nombre} no tiene variantes`);
            }
            return {
                producto: p,
                idVariante: null,
                nombre: p.nombre,
                cantidad: it.cantidad,
                precio: redondo(p.precio),
            };
        });
        const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
        if (total <= 0)
            throw new common_1.BadRequestException('El apartado debe tener un valor mayor a 0');
        const creado = await this.prisma.$transaction(async (tx) => {
            for (const l of lineas) {
                try {
                    await (0, stock_retail_1.descontarStockRetailTx)(tx, { idProducto: l.producto.idProducto, idProductoVariante: l.idVariante, cantidad: l.cantidad, producto: l.producto }, l.cantidad);
                }
                catch {
                    throw new common_1.ConflictException(`No hay stock suficiente de ${l.nombre}`);
                }
            }
            return tx.apartado.create({
                data: {
                    idRestaurante: tenantId,
                    idTienda,
                    clienteNombre: dto.cliente_nombre.trim(),
                    clienteTelefono: dto.cliente_telefono?.trim() || null,
                    notas: dto.notas?.trim() || null,
                    fechaLimite: dto.fecha_limite ? fechaDb(dto.fecha_limite) : null,
                    total,
                    idUsuario: actor.idUsuario,
                    items: {
                        create: lineas.map((l) => ({
                            idProducto: l.producto.idProducto,
                            idVariante: l.idVariante,
                            nombre: l.nombre.slice(0, 200),
                            cantidad: l.cantidad,
                            precioUnitario: l.precio,
                        })),
                    },
                },
                include: apartadoInclude,
            });
        });
        this.gateway.emitConfigActualizada('inventario', tenantId);
        return (await this.mapear([creado]))[0];
    }
    async actualizar(id, dto, actor) {
        const r = await this.obtenerRow(id, actor.idRestaurante);
        if (r.estado !== 'activo') {
            throw new common_1.ConflictException('Solo se edita un apartado activo');
        }
        const row = await this.prisma.apartado.update({
            where: { idApartado: id },
            data: {
                ...(dto.cliente_nombre != null ? { clienteNombre: dto.cliente_nombre.trim() } : {}),
                ...(dto.cliente_telefono !== undefined
                    ? { clienteTelefono: dto.cliente_telefono?.trim() || null }
                    : {}),
                ...(dto.notas !== undefined ? { notas: dto.notas?.trim() || null } : {}),
                ...(dto.fecha_limite !== undefined
                    ? { fechaLimite: dto.fecha_limite ? fechaDb(dto.fecha_limite) : null }
                    : {}),
            },
            include: apartadoInclude,
        });
        return (await this.mapear([row]))[0];
    }
    async abonar(id, dto, actor) {
        const tenantId = actor.idRestaurante;
        const r = await this.obtenerRow(id, tenantId);
        if (r.estado !== 'activo') {
            throw new common_1.ConflictException('Solo se abona a un apartado activo');
        }
        const monto = Math.round(dto.monto);
        const mapa = await this.pedidosAbono(r.abonos.map((a) => a.idPedido));
        const pagado = this.totalPagado(r, mapa);
        const saldo = redondo(r.total) - pagado;
        if (saldo <= 0)
            throw new common_1.ConflictException('Este apartado ya está pagado');
        if (monto > saldo) {
            throw new common_1.BadRequestException(`El abono supera el saldo pendiente (${saldo})`);
        }
        const pendiente = r.abonos.find((a) => this.estadoAbono(a.idPedido, mapa) === 'por_cobrar');
        if (pendiente) {
            const p = mapa.get(pendiente.idPedido);
            if (p.cobrado > 0) {
                throw new common_1.ConflictException('Hay un abono a medio cobrar; termínalo en la pantalla de cobro');
            }
            await this.prisma.$transaction([
                this.prisma.detallePedido.updateMany({
                    where: { idPedido: pendiente.idPedido },
                    data: { precioUnitario: monto },
                }),
                this.prisma.apartadoAbono.update({
                    where: { idAbono: pendiente.idAbono },
                    data: { monto },
                }),
            ]);
            this.gateway.emitPedidoActualizado(pendiente.idPedido, p.idMesa, actor.idUsuario, tenantId);
            return { id_pedido: pendiente.idPedido };
        }
        const idProducto = await this.servicios.idProductoAbonoApartado(tenantId);
        const creado = (await this.tiendas.abrirVenta(actor, tenantId, r.idTienda));
        const idPedido = creado.id_pedido;
        const { idMesa } = await this.prisma.pedido.findUniqueOrThrow({
            where: { idPedido },
            select: { idMesa: true },
        });
        const n = r.abonos.filter((a) => mapa.get(a.idPedido)?.estado === 'facturado').length + 1;
        await this.prisma.$transaction([
            this.prisma.detallePedido.create({
                data: {
                    idPedido,
                    idProducto,
                    cantidad: 1,
                    precioUnitario: monto,
                    notaCocina: `Apartado #${r.idApartado} · abono ${n} · ${r.clienteNombre}`.slice(0, 250),
                    enviadoCocina: false,
                    listoCocina: false,
                    listoParaRecoger: false,
                },
            }),
            this.prisma.pedido.update({
                where: { idPedido },
                data: {
                    clienteNombre: r.clienteNombre,
                    ...(r.clienteTelefono ? { clienteTelefono: r.clienteTelefono } : {}),
                },
            }),
            this.prisma.apartadoAbono.create({
                data: { idApartado: r.idApartado, monto, idPedido, idUsuario: actor.idUsuario },
            }),
        ]);
        this.gateway.emitPedidoActualizado(idPedido, idMesa, actor.idUsuario, tenantId);
        return { id_pedido: idPedido };
    }
    async entregar(id, actor) {
        const r = await this.obtenerRow(id, actor.idRestaurante);
        if (r.estado !== 'activo') {
            throw new common_1.ConflictException('Este apartado no está activo');
        }
        const mapa = await this.pedidosAbono(r.abonos.map((a) => a.idPedido));
        const saldo = redondo(r.total) - this.totalPagado(r, mapa);
        if (saldo > 0) {
            throw new common_1.ConflictException(`Falta pagar ${saldo} para entregar el apartado`);
        }
        const row = await this.prisma.apartado.update({
            where: { idApartado: id },
            data: { estado: 'entregado', entregadoEn: new Date() },
            include: apartadoInclude,
        });
        return (await this.mapear([row]))[0];
    }
    async cancelar(id, actor) {
        await this.permisos.assertPermiso(actor, 'cancelar_pedido');
        const tenantId = actor.idRestaurante;
        const r = await this.obtenerRow(id, tenantId);
        if (r.estado !== 'activo') {
            throw new common_1.ConflictException('Este apartado no está activo');
        }
        const mapa = await this.pedidosAbono(r.abonos.map((a) => a.idPedido));
        const abiertos = r.abonos
            .map((a) => mapa.get(a.idPedido))
            .filter((p) => p != null && p.estado !== 'facturado');
        if (abiertos.some((p) => p.cobrado > 0)) {
            throw new common_1.ConflictException('Hay un abono a medio cobrar; termínalo antes de cancelar');
        }
        for (const p of abiertos) {
            await this.pedidos.cancelar(p.idPedido, actor);
        }
        const productos = await this.prisma.producto.findMany({
            where: { idProducto: { in: r.items.map((i) => i.idProducto) } },
            select: { idProducto: true, controlStock: true, categoria: { select: { canal: true } } },
        });
        const porId = new Map(productos.map((p) => [p.idProducto, p]));
        const row = await this.prisma.$transaction(async (tx) => {
            for (const it of r.items) {
                const p = porId.get(it.idProducto);
                if (!p)
                    continue;
                await (0, stock_retail_1.reintegrarStockRetailTx)(tx, {
                    idProducto: it.idProducto,
                    idProductoVariante: it.idVariante,
                    cantidad: it.cantidad,
                    producto: p,
                });
            }
            return tx.apartado.update({
                where: { idApartado: id },
                data: { estado: 'cancelado' },
                include: apartadoInclude,
            });
        });
        this.gateway.emitConfigActualizada('inventario', tenantId);
        return (await this.mapear([row]))[0];
    }
    async obtenerRow(id, tenantId) {
        const r = await this.prisma.apartado.findFirst({
            where: { idApartado: id, idRestaurante: tenantId },
            include: apartadoInclude,
        });
        if (!r)
            throw new common_1.NotFoundException('Apartado no encontrado');
        return r;
    }
    async pedidosAbono(ids) {
        const mapa = new Map();
        if (ids.length === 0)
            return mapa;
        const rows = await this.prisma.pedido.findMany({
            where: { idPedido: { in: ids } },
            select: { idPedido: true, idMesa: true, estado: true, facturas: { select: { total: true } } },
        });
        for (const p of rows) {
            mapa.set(p.idPedido, {
                idPedido: p.idPedido,
                idMesa: p.idMesa,
                estado: p.estado,
                cobrado: Math.round(p.facturas.reduce((s, f) => s + Number(f.total), 0)),
            });
        }
        return mapa;
    }
    estadoAbono(idPedido, mapa) {
        const p = mapa.get(idPedido);
        if (!p)
            return 'anulado';
        return p.estado === 'facturado' ? 'pagado' : 'por_cobrar';
    }
    montoAbonado(a, mapa) {
        const p = mapa.get(a.idPedido);
        return p?.estado === 'facturado' ? Math.min(p.cobrado, redondo(a.monto)) : 0;
    }
    totalPagado(r, mapa) {
        return r.abonos.reduce((s, a) => s + this.montoAbonado(a, mapa), 0);
    }
    async mapear(rows) {
        const mapa = await this.pedidosAbono(rows.flatMap((r) => r.abonos.map((a) => a.idPedido)));
        return rows.map((r) => {
            const total = redondo(r.total);
            const pagado = this.totalPagado(r, mapa);
            const abonos = r.abonos
                .map((a) => ({
                id_abono: a.idAbono,
                id_pedido: a.idPedido,
                monto: this.estadoAbono(a.idPedido, mapa) === 'pagado'
                    ? this.montoAbonado(a, mapa)
                    : redondo(a.monto),
                estado: this.estadoAbono(a.idPedido, mapa),
                creado_en: a.creadoEn.toISOString(),
            }))
                .filter((a) => a.estado !== 'anulado');
            return {
                id_apartado: r.idApartado,
                id_tienda: r.idTienda,
                tienda_nombre: r.tienda.nombre,
                cliente_nombre: r.clienteNombre,
                cliente_telefono: r.clienteTelefono,
                notas: r.notas,
                fecha_limite: r.fechaLimite ? r.fechaLimite.toISOString().slice(0, 10) : null,
                estado: r.estado,
                total,
                pagado,
                saldo: Math.max(0, total - pagado),
                items: r.items.map((i) => ({
                    id_item: i.idItem,
                    id_producto: i.idProducto,
                    id_variante: i.idVariante,
                    nombre: i.nombre,
                    cantidad: i.cantidad,
                    precio_unitario: redondo(i.precioUnitario),
                })),
                abonos,
                abono_pendiente: abonos.find((a) => a.estado === 'por_cobrar') ?? null,
                creado_en: r.creadoEn.toISOString(),
                entregado_en: r.entregadoEn?.toISOString() ?? null,
            };
        });
    }
};
exports.ApartadosService = ApartadosService;
exports.ApartadosService = ApartadosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_service_1.PedidosService,
        pedidos_gateway_1.PedidosGateway,
        servicios_service_1.ServiciosService,
        tienda_service_1.TiendaService,
        permisos_service_1.PermisosService])
], ApartadosService);
//# sourceMappingURL=apartados.service.js.map