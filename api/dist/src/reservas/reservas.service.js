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
exports.ReservasService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const luxon_1 = require("luxon");
const mesa_dia_1 = require("../common/mesa-dia");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const pedidos_service_1 = require("../pedidos/pedidos.service");
const prisma_service_1 = require("../prisma/prisma.service");
const servicios_service_1 = require("../servicios/servicios.service");
const ZONA = 'America/Bogota';
const DURACION_DEFAULT = 120;
const reservaInclude = {
    mesa: {
        select: {
            idMesa: true,
            numero: true,
            idLugar: true,
            estado: true,
            lugar: { select: { nombre: true } },
        },
    },
    lugar: { select: { idLugar: true, nombre: true } },
};
function fechaDb(iso) {
    return new Date(`${iso}T00:00:00.000Z`);
}
function fechaIso(d) {
    return d.toISOString().slice(0, 10);
}
function minutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}
function hoyBogota() {
    return luxon_1.DateTime.now().setZone(ZONA).toISODate();
}
let ReservasService = class ReservasService {
    prisma;
    pedidos;
    gateway;
    servicios;
    constructor(prisma, pedidos, gateway, servicios) {
        this.prisma = prisma;
        this.pedidos = pedidos;
        this.gateway = gateway;
        this.servicios = servicios;
    }
    async listar(tenantId, q) {
        const desde = q.desde ?? q.fecha ?? hoyBogota();
        const hasta = q.hasta ?? q.fecha ?? desde;
        const rows = await this.prisma.reserva.findMany({
            where: { idRestaurante: tenantId, fecha: { gte: fechaDb(desde), lte: fechaDb(hasta) } },
            include: reservaInclude,
            orderBy: [{ fecha: 'asc' }, { hora: 'asc' }, { idReserva: 'asc' }],
        });
        return this.mapear(rows);
    }
    async crear(dto, actor) {
        const tenantId = actor.idRestaurante;
        const destino = await this.validarDestino(tenantId, dto.id_mesa ?? null, dto.id_lugar ?? null);
        const idServicio = await this.validarServicio(tenantId, dto.id_producto_servicio ?? null);
        const duracion = dto.duracion_min ?? DURACION_DEFAULT;
        await this.assertSinChoque(tenantId, null, dto.fecha, dto.hora, duracion, destino);
        const creada = await this.prisma.reserva.create({
            data: {
                idRestaurante: tenantId,
                idMesa: destino.idMesa,
                idLugar: destino.idLugar,
                fecha: fechaDb(dto.fecha),
                hora: dto.hora,
                duracionMin: duracion,
                personas: dto.personas,
                clienteNombre: dto.cliente_nombre.trim(),
                clienteTelefono: dto.cliente_telefono?.trim() || null,
                notas: dto.notas?.trim() || null,
                idProductoServicio: idServicio,
                anticipoMonto: Math.round(dto.anticipo_monto ?? 0),
                idUsuario: actor.idUsuario,
            },
            include: reservaInclude,
        });
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return (await this.mapear([creada]))[0];
    }
    async actualizar(id, dto, actor) {
        const tenantId = actor.idRestaurante;
        const r = await this.obtenerRow(id, tenantId);
        if (r.estado === 'cumplida') {
            throw new common_1.ConflictException('Esta reserva ya se convirtió en una mesa abierta');
        }
        const cambiaDestino = dto.id_mesa !== undefined || dto.id_lugar !== undefined;
        const destino = cambiaDestino
            ? await this.validarDestino(tenantId, dto.id_mesa !== undefined ? dto.id_mesa : dto.id_lugar != null ? null : r.idMesa, dto.id_lugar !== undefined ? dto.id_lugar : dto.id_mesa != null ? null : r.idLugar)
            : { idMesa: r.idMesa, idLugar: r.idLugar, idLugarDeMesa: r.mesa?.idLugar ?? null };
        const idServicio = dto.id_producto_servicio !== undefined
            ? await this.validarServicio(tenantId, dto.id_producto_servicio)
            : r.idProductoServicio;
        if (dto.anticipo_monto != null && r.idPedidoAnticipo != null) {
            const ant = await this.estadoAnticipo(r);
            if (ant.cobrado > 0 && Math.round(dto.anticipo_monto) !== Math.round(Number(r.anticipoMonto))) {
                throw new common_1.ConflictException('El anticipo ya se cobró; no se puede cambiar el monto');
            }
        }
        const fecha = dto.fecha ?? fechaIso(r.fecha);
        const hora = dto.hora ?? r.hora;
        const duracion = dto.duracion_min ?? r.duracionMin;
        const estado = dto.estado ?? r.estado;
        if (estado === 'activa') {
            await this.assertSinChoque(tenantId, r.idReserva, fecha, hora, duracion, destino);
        }
        const actualizada = await this.prisma.reserva.update({
            where: { idReserva: id },
            data: {
                idMesa: destino.idMesa,
                idLugar: destino.idLugar,
                fecha: fechaDb(fecha),
                hora,
                duracionMin: duracion,
                estado,
                idProductoServicio: idServicio,
                ...(dto.personas != null ? { personas: dto.personas } : {}),
                ...(dto.cliente_nombre != null ? { clienteNombre: dto.cliente_nombre.trim() } : {}),
                ...(dto.cliente_telefono !== undefined
                    ? { clienteTelefono: dto.cliente_telefono?.trim() || null }
                    : {}),
                ...(dto.notas !== undefined ? { notas: dto.notas?.trim() || null } : {}),
                ...(dto.anticipo_monto != null ? { anticipoMonto: Math.round(dto.anticipo_monto) } : {}),
            },
            include: reservaInclude,
        });
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return (await this.mapear([actualizada]))[0];
    }
    async cobrarAnticipo(id, actor) {
        const tenantId = actor.idRestaurante;
        const r = await this.obtenerRow(id, tenantId);
        if (r.estado !== 'activa') {
            throw new common_1.ConflictException('Solo se cobra el anticipo de una reserva activa');
        }
        const monto = Math.round(Number(r.anticipoMonto));
        if (monto <= 0) {
            throw new common_1.BadRequestException('Esta reserva no tiene anticipo');
        }
        if (r.idPedidoAnticipo != null) {
            const previo = await this.prisma.pedido.findUnique({
                where: { idPedido: r.idPedidoAnticipo },
                select: { idPedido: true, estado: true },
            });
            if (previo?.estado === 'facturado') {
                throw new common_1.ConflictException('El anticipo de esta reserva ya fue cobrado');
            }
            if (previo)
                return { id_pedido: previo.idPedido };
        }
        const op = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
            select: { numeroMesaMostrador: true },
        });
        const mesaMostrador = await this.prisma.mesa.findFirst({
            where: { idRestaurante: tenantId, numero: op?.numeroMesaMostrador ?? 99 },
            select: { idMesa: true },
        });
        if (!mesaMostrador) {
            throw new common_1.ConflictException('No existe la mesa del mostrador para cobrar el anticipo');
        }
        const idProducto = await this.servicios.idProductoAnticipo(tenantId);
        const pedido = await this.pedidos.crear({ id_mesa: mesaMostrador.idMesa, num_comensales: 1 }, actor.idUsuario, tenantId, actor);
        const idPedido = pedido.id_pedido;
        const etiquetaFecha = luxon_1.DateTime.fromISO(fechaIso(r.fecha), { zone: ZONA }).toFormat('dd/MM');
        await this.prisma.$transaction([
            this.prisma.detallePedido.create({
                data: {
                    idPedido,
                    idProducto,
                    cantidad: 1,
                    precioUnitario: monto,
                    notaCocina: `Reserva #${r.idReserva} · ${r.clienteNombre} · ${etiquetaFecha} ${r.hora}`.slice(0, 250),
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
            this.prisma.reserva.update({
                where: { idReserva: r.idReserva },
                data: { idPedidoAnticipo: idPedido },
            }),
        ]);
        this.gateway.emitPedidoActualizado(idPedido, mesaMostrador.idMesa, actor.idUsuario, tenantId);
        return { id_pedido: idPedido };
    }
    async abrir(id, dto, actor) {
        const tenantId = actor.idRestaurante;
        const r = await this.obtenerRow(id, tenantId);
        if (r.estado !== 'activa') {
            throw new common_1.ConflictException('Solo se puede abrir una reserva activa');
        }
        const idMesa = dto.id_mesa ?? (await this.mesaParaAbrir(r, tenantId));
        const mesa = await this.prisma.mesa.findFirst({
            where: { idMesa, idRestaurante: tenantId },
        });
        if (!mesa)
            throw new common_1.NotFoundException('Mesa no encontrada');
        if (mesa.estado === 'ocupada') {
            throw new common_1.ConflictException(`La mesa ${mesa.numero} está ocupada. Elige otra.`);
        }
        if (mesa.estado === 'reservada') {
            await this.prisma.mesa.update({ where: { idMesa }, data: { estado: 'libre' } });
        }
        const pedido = await this.pedidos.crear({ id_mesa: idMesa, num_comensales: Math.max(1, r.personas) }, actor.idUsuario, tenantId, actor);
        const idPedido = pedido.id_pedido;
        const avisos = [];
        if (r.idProductoServicio != null) {
            try {
                await this.pedidos.agregarDetalle(idPedido, { id_producto: r.idProductoServicio, cantidad: 1 }, actor);
            }
            catch {
                avisos.push('No se pudo agregar el servicio reservado (puede estar inactivo).');
            }
        }
        const ant = await this.estadoAnticipo(r);
        let aplicado = 0;
        if (ant.cobrado > 0) {
            aplicado = ant.cobrado;
            await this.aplicarAnticipoEnPedido(idPedido, r.idReserva, aplicado, actor.idUsuario);
        }
        else if (Number(r.anticipoMonto) > 0) {
            avisos.push('El anticipo no se había cobrado; la cuenta va completa.');
        }
        await this.prisma.reserva.update({
            where: { idReserva: r.idReserva },
            data: {
                estado: 'cumplida',
                idPedido,
                idMesa: r.idMesa ?? idMesa,
                anticipoAplicado: aplicado,
            },
        });
        this.gateway.emitPedidoActualizado(idPedido, idMesa, actor.idUsuario, tenantId);
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return { id_pedido: idPedido, id_mesa: idMesa, anticipo_aplicado: aplicado, avisos };
    }
    async aplicarAnticipoEnPedido(idPedido, idReserva, monto, idUsuario) {
        await this.prisma.$transaction(async (tx) => {
            const p = await tx.pedido.findUnique({
                where: { idPedido },
                select: { descuentoManualMonto: true },
            });
            const anterior = Math.round(Number(p?.descuentoManualMonto ?? 0));
            const nuevo = anterior + monto;
            const motivo = `Anticipo reserva #${idReserva}`;
            await tx.pedido.update({
                where: { idPedido },
                data: {
                    descuentoManualMonto: new client_1.Prisma.Decimal(nuevo),
                    descuentoManualMotivo: motivo,
                },
            });
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario,
                    tipo: 'descuento_manual_actualizado',
                    detalleJson: {
                        modo: 'monto',
                        valor: monto,
                        monto_anterior: anterior,
                        monto_nuevo: nuevo,
                        motivo,
                        total_antes: null,
                        total_despues: null,
                        autorizado_por: 'Anticipo de reserva',
                        id_reserva: idReserva,
                    },
                },
            });
        });
    }
    async mesaParaAbrir(r, tenantId) {
        if (r.idMesa != null)
            return r.idMesa;
        if (r.idLugar == null) {
            throw new common_1.BadRequestException('Elige la mesa donde se sienta el cliente');
        }
        const mesas = await this.prisma.mesa.findMany({
            where: { idRestaurante: tenantId, idLugar: r.idLugar, idTienda: null, estado: { not: 'ocupada' } },
            orderBy: { numero: 'asc' },
        });
        const libre = mesas.find((m) => (0, mesa_dia_1.mesaDisponibleHoyBogota)(m));
        if (!libre) {
            throw new common_1.ConflictException('No hay mesas libres en ese espacio. Elige otra mesa.');
        }
        return libre.idMesa;
    }
    async obtenerRow(id, tenantId) {
        const r = await this.prisma.reserva.findFirst({
            where: { idReserva: id, idRestaurante: tenantId },
            include: reservaInclude,
        });
        if (!r)
            throw new common_1.NotFoundException('Reserva no encontrada');
        return r;
    }
    async validarDestino(tenantId, idMesa, idLugar) {
        if ((idMesa == null) === (idLugar == null)) {
            throw new common_1.BadRequestException('Elige una mesa o un espacio completo');
        }
        if (idMesa != null) {
            const [mesa, op] = await Promise.all([
                this.prisma.mesa.findFirst({ where: { idMesa, idRestaurante: tenantId } }),
                this.prisma.configOperativa.findUnique({
                    where: { idRestaurante: tenantId },
                    select: { numeroMesaMostrador: true, numeroMesaParaLlevar: true, numeroMesaBoutique: true },
                }),
            ]);
            if (!mesa)
                throw new common_1.NotFoundException('Mesa no encontrada');
            const virtuales = [
                op?.numeroMesaMostrador ?? 99,
                op?.numeroMesaParaLlevar ?? 98,
                op?.numeroMesaBoutique ?? 97,
            ];
            if (mesa.idTienda != null || virtuales.includes(mesa.numero)) {
                throw new common_1.BadRequestException('Esa mesa no se puede reservar');
            }
            return { idMesa, idLugar: null, idLugarDeMesa: mesa.idLugar };
        }
        const lugar = await this.prisma.lugarMesa.findFirst({
            where: { idLugar: idLugar, idRestaurante: tenantId },
        });
        if (!lugar)
            throw new common_1.NotFoundException('Espacio no encontrado');
        return { idMesa: null, idLugar: idLugar, idLugarDeMesa: null };
    }
    async validarServicio(tenantId, id) {
        if (id == null)
            return null;
        const p = await this.prisma.producto.findFirst({
            where: { idProducto: id, activo: true, categoria: { idRestaurante: tenantId, canal: 'servicio' } },
            select: { idProducto: true },
        });
        if (!p)
            throw new common_1.BadRequestException('El servicio elegido no está disponible');
        return p.idProducto;
    }
    async assertSinChoque(tenantId, idReservaPropia, fecha, hora, duracion, destino) {
        const otras = await this.prisma.reserva.findMany({
            where: {
                idRestaurante: tenantId,
                fecha: fechaDb(fecha),
                estado: 'activa',
                ...(idReservaPropia != null ? { idReserva: { not: idReservaPropia } } : {}),
            },
            include: reservaInclude,
        });
        const ini = minutos(hora);
        const fin = ini + duracion;
        for (const o of otras) {
            const oIni = minutos(o.hora);
            const oFin = oIni + o.duracionMin;
            if (!(ini < oFin && oIni < fin))
                continue;
            const choca = destino.idMesa != null
                ? o.idMesa === destino.idMesa ||
                    (o.idLugar != null && o.idLugar === destino.idLugarDeMesa)
                : o.idLugar === destino.idLugar ||
                    (o.mesa != null && o.mesa.idLugar === destino.idLugar);
            if (choca) {
                const donde = o.mesa ? `la mesa ${o.mesa.numero}` : (o.lugar?.nombre ?? 'ese espacio');
                throw new common_1.ConflictException(`Ya hay una reserva de ${o.clienteNombre} a las ${o.hora} en ${donde}`);
            }
        }
    }
    async estadoAnticipo(r) {
        const mapa = await this.pedidosAnticipo([r.idPedidoAnticipo]);
        return this.resolverAnticipo(r, mapa);
    }
    async pedidosAnticipo(ids) {
        const validos = ids.filter((x) => x != null);
        const mapa = new Map();
        if (validos.length === 0)
            return mapa;
        const rows = await this.prisma.pedido.findMany({
            where: { idPedido: { in: validos } },
            select: { idPedido: true, estado: true, facturas: { select: { total: true } } },
        });
        for (const p of rows) {
            mapa.set(p.idPedido, {
                estado: p.estado,
                cobrado: Math.round(p.facturas.reduce((s, f) => s + Number(f.total), 0)),
            });
        }
        return mapa;
    }
    resolverAnticipo(r, mapa) {
        if (Number(r.anticipoAplicado) > 0) {
            return { estado: 'aplicado', cobrado: Math.round(Number(r.anticipoAplicado)) };
        }
        if (Number(r.anticipoMonto) <= 0)
            return { estado: 'sin', cobrado: 0 };
        const p = r.idPedidoAnticipo != null ? mapa.get(r.idPedidoAnticipo) : undefined;
        if (!p)
            return { estado: 'pendiente', cobrado: 0 };
        if (p.estado === 'facturado')
            return { estado: 'pagado', cobrado: p.cobrado };
        return { estado: 'por_cobrar', cobrado: 0 };
    }
    async mapear(rows) {
        const [mapaAnticipo, servicios] = await Promise.all([
            this.pedidosAnticipo(rows.map((r) => r.idPedidoAnticipo)),
            this.prisma.producto.findMany({
                where: {
                    idProducto: {
                        in: rows.map((r) => r.idProductoServicio).filter((x) => x != null),
                    },
                },
                select: { idProducto: true, nombre: true, precio: true },
            }),
        ]);
        const servicioPorId = new Map(servicios.map((s) => [s.idProducto, s]));
        return rows.map((r) => {
            const ant = this.resolverAnticipo(r, mapaAnticipo);
            const s = r.idProductoServicio != null ? servicioPorId.get(r.idProductoServicio) : undefined;
            return {
                id_reserva: r.idReserva,
                fecha: fechaIso(r.fecha),
                hora: r.hora,
                duracion_min: r.duracionMin,
                personas: r.personas,
                cliente_nombre: r.clienteNombre,
                cliente_telefono: r.clienteTelefono,
                notas: r.notas,
                estado: r.estado,
                id_mesa: r.idMesa,
                mesa_numero: r.mesa?.numero ?? null,
                id_lugar: r.idLugar ?? r.mesa?.idLugar ?? null,
                lugar_nombre: r.lugar?.nombre ?? r.mesa?.lugar?.nombre ?? null,
                es_espacio: r.idLugar != null,
                servicio: s
                    ? { id_producto: s.idProducto, nombre: s.nombre, precio: Math.round(Number(s.precio)) }
                    : null,
                anticipo_monto: Math.round(Number(r.anticipoMonto)),
                anticipo_estado: ant.estado,
                anticipo_cobrado: ant.cobrado,
                id_pedido_anticipo: r.idPedidoAnticipo,
                id_pedido: r.idPedido,
            };
        });
    }
};
exports.ReservasService = ReservasService;
exports.ReservasService = ReservasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_service_1.PedidosService,
        pedidos_gateway_1.PedidosGateway,
        servicios_service_1.ServiciosService])
], ReservasService);
//# sourceMappingURL=reservas.service.js.map