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
exports.ParkingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const comanda_printer_service_1 = require("../pedidos/comanda-printer.service");
const prisma_service_1 = require("../prisma/prisma.service");
const ABIERTOS = ['OPEN', 'PENDING_PAYMENT'];
let ParkingService = class ParkingService {
    prisma;
    printer;
    constructor(prisma, printer) {
        this.prisma = prisma;
        this.printer = printer;
    }
    async exigirModulo(tenantId) {
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { moduloParqueaderoActivo: true },
        });
        if (!cfg?.moduloParqueaderoActivo) {
            throw new common_1.ForbiddenException('El parqueadero no está habilitado para este restaurante');
        }
    }
    async audit(tenantId, idUsuario, accion, detalle) {
        await this.prisma.parkingAuditLog.create({
            data: { idRestaurante: tenantId, idUsuario, accion, detalle: detalle ?? undefined },
        });
    }
    async settings(tenantId) {
        await this.exigirModulo(tenantId);
        return this.prisma.parkingSettings.upsert({
            where: { idRestaurante: tenantId },
            create: { idRestaurante: tenantId },
            update: {},
        });
    }
    async putSettings(tenantId, idUsuario, body) {
        await this.exigirModulo(tenantId);
        const data = {
            ...(typeof body.nombre === 'string' && body.nombre.trim()
                ? { nombre: body.nombre.trim().slice(0, 120) }
                : {}),
            activo: body.activo !== false,
            toleranciaSegundos: Math.max(0, Number(body.tolerancia_segundos ?? 0)),
            permitePlacaParcial: body.permite_placa_parcial !== false,
            permiteIdAlternativo: body.permite_id_alternativo !== false,
            politicaPlanes: ['SINGLE', 'MULTIPLE', 'COMPATIBLE'].includes(String(body.politica_planes))
                ? String(body.politica_planes)
                : 'SINGLE',
            politicaVencimiento: ['CHARGE_REMAINDER', 'FREE_EXIT', 'ADMIN_DECISION'].includes(String(body.politica_vencimiento))
                ? String(body.politica_vencimiento)
                : 'CHARGE_REMAINDER',
            permitePagoParcial: body.permite_pago_parcial !== false,
            unidadCobro: body.unidad_cobro === 'minuto' ? 'minuto' : 'hora',
            modoRedondeo: body.modo_redondeo === 'arriba' ? 'arriba' : 'exacto',
        };
        const row = await this.prisma.parkingSettings.upsert({
            where: { idRestaurante: tenantId },
            create: { idRestaurante: tenantId, ...data },
            update: data,
        });
        await this.audit(tenantId, idUsuario, 'settings', data);
        return row;
    }
    async tipos(tenantId) {
        await this.exigirModulo(tenantId);
        return this.prisma.parkingVehicleType.findMany({
            where: { idRestaurante: tenantId },
            orderBy: { nombre: 'asc' },
        });
    }
    async crearTipo(tenantId, nombre) {
        await this.exigirModulo(tenantId);
        const n = nombre.trim();
        if (n.length < 2)
            throw new common_1.BadRequestException('Nombre de tipo inválido');
        return this.prisma.parkingVehicleType.create({
            data: { idRestaurante: tenantId, nombre: n },
        });
    }
    async actualizarTipo(tenantId, id, body) {
        await this.exigirModulo(tenantId);
        const row = await this.prisma.parkingVehicleType.findFirst({
            where: { idTipo: id, idRestaurante: tenantId },
        });
        if (!row)
            throw new common_1.NotFoundException('Tipo no encontrado');
        return this.prisma.parkingVehicleType.update({
            where: { idTipo: id },
            data: {
                ...(body.nombre ? { nombre: body.nombre.trim() } : {}),
                ...(body.activo != null ? { activo: body.activo } : {}),
            },
        });
    }
    async tarifas(tenantId) {
        await this.exigirModulo(tenantId);
        return this.prisma.parkingRate.findMany({
            where: { idRestaurante: tenantId, activo: true },
            orderBy: { vigenteDesde: 'desc' },
        });
    }
    async crearTarifa(tenantId, idUsuario, body) {
        await this.exigirModulo(tenantId);
        if (body.precio < 0 || body.segundos_unidad < 1) {
            throw new common_1.BadRequestException('Tarifa inválida');
        }
        await this.prisma.parkingRate.updateMany({
            where: { idRestaurante: tenantId, idTipo: body.id_tipo, activo: true },
            data: { activo: false },
        });
        const row = await this.prisma.parkingRate.create({
            data: {
                idRestaurante: tenantId,
                idTipo: body.id_tipo,
                precio: body.precio,
                segundosUnidad: body.segundos_unidad,
                cobroMinimo: body.cobro_minimo ?? 0,
                toleranciaSegundos: body.tolerancia_segundos ?? 0,
            },
        });
        await this.audit(tenantId, idUsuario, 'tarifa', { id: row.idTarifa });
        return row;
    }
    async buscarVehiculos(tenantId, q) {
        await this.exigirModulo(tenantId);
        const query = q.trim().toUpperCase();
        if (!query)
            return [];
        return this.prisma.parkingVehicle.findMany({
            where: {
                idRestaurante: tenantId,
                OR: [
                    { placaCompleta: { contains: query } },
                    { letras: { contains: query } },
                    { numeros: { contains: query } },
                    { codigoIdentificacion: { contains: query } },
                ],
            },
            take: 20,
        });
    }
    async crearVehiculo(tenantId, body) {
        await this.exigirModulo(tenantId);
        const tipo = await this.prisma.parkingVehicleType.findFirst({
            where: { idTipo: body.id_tipo, idRestaurante: tenantId, activo: true },
        });
        if (!tipo)
            throw new common_1.NotFoundException('Tipo de vehículo no encontrado');
        const prefijo = tipo.nombre.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
        const cruda = body.tipo_identificacion === 'PARCIAL'
            ? `${prefijo}${(body.complemento ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')}`
            : (body.placa ?? `${body.letras ?? ''}${body.numeros ?? ''}`).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const letras = cruda.replace(/[^A-Z]/g, '');
        const numeros = cruda.replace(/\D/g, '');
        const placa = cruda;
        const codigo = body.tipo_identificacion === 'ALTERNO'
            ? (body.codigo ?? '').trim()
            : placa;
        if (!codigo || (body.tipo_identificacion === 'PARCIAL' && !(body.complemento ?? '').trim())) {
            throw new common_1.BadRequestException('Falta la placa o el complemento');
        }
        return this.prisma.parkingVehicle.create({
            data: {
                idRestaurante: tenantId,
                idTipo: body.id_tipo,
                letras,
                numeros,
                placaCompleta: placa,
                tipoIdentificacion: body.tipo_identificacion,
                codigoIdentificacion: codigo,
            },
        });
    }
    liquidar(segundos, tarifa) {
        const cobrables = Math.max(0, segundos - tarifa.toleranciaSegundos);
        if (cobrables === 0)
            return 0;
        const precio = Number(tarifa.precio);
        const unidades = tarifa.modoRedondeo === 'arriba'
            ? Math.ceil(cobrables / tarifa.segundosUnidad)
            : cobrables / tarifa.segundosUnidad;
        return Math.max(Number(tarifa.cobroMinimo), Math.round(unidades * precio));
    }
    async entrada(tenantId, idUsuario, body) {
        await this.exigirModulo(tenantId);
        const vehiculo = await this.prisma.parkingVehicle.findFirst({
            where: { idVehiculo: body.id_vehiculo, idRestaurante: tenantId },
        });
        if (!vehiculo)
            throw new common_1.NotFoundException('Vehículo no encontrado');
        const abierto = await this.prisma.parkingTicket.findFirst({
            where: {
                idVehiculo: vehiculo.idVehiculo,
                idUnidad: body.id_unidad ?? null,
                estado: { in: ABIERTOS },
            },
        });
        if (abierto)
            throw new common_1.ConflictException('Ese vehículo ya tiene un ticket abierto en la unidad');
        const tarifa = await this.prisma.parkingRate.findFirst({
            where: { idRestaurante: tenantId, idTipo: vehiculo.idTipo, activo: true },
            orderBy: { vigenteDesde: 'desc' },
        });
        if (!tarifa)
            throw new common_1.BadRequestException('No hay tarifa vigente para ese tipo de vehículo');
        const settings = await this.settings(tenantId);
        const suscripcion = await this.prisma.parkingSubscription.findFirst({
            where: {
                idRestaurante: tenantId,
                idVehiculo: vehiculo.idVehiculo,
                estado: 'ACTIVA',
                venceEn: { gt: new Date() },
            },
            orderBy: { venceEn: 'desc' },
        });
        const ticket = await this.prisma.parkingTicket.create({
            data: {
                idRestaurante: tenantId,
                idUnidad: body.id_unidad ?? null,
                idVehiculo: vehiculo.idVehiculo,
                idSuscripcion: suscripcion?.idSuscripcion ?? null,
                estado: 'OPEN',
                entradaEn: new Date(),
                tarifaFoto: {
                    precio: Number(tarifa.precio),
                    segundos_unidad: tarifa.segundosUnidad,
                    modo_redondeo: settings.modoRedondeo,
                    unidad_cobro: settings.unidadCobro,
                    cobro_minimo: Number(tarifa.cobroMinimo),
                    tolerancia_segundos: tarifa.toleranciaSegundos,
                    id_tarifa: tarifa.idTarifa,
                },
                politicaVencimiento: settings.politicaVencimiento,
            },
        });
        await this.audit(tenantId, idUsuario, 'entrada', { id_ticket: ticket.idTicket });
        const [restaurante, tipo] = await Promise.all([
            this.prisma.restaurante.findUnique({
                where: { idRestaurante: tenantId },
                select: { nombre: true },
            }),
            this.prisma.parkingVehicleType.findUnique({
                where: { idTipo: vehiculo.idTipo },
                select: { nombre: true },
            }),
        ]);
        const unidad = settings.unidadCobro === 'minuto' ? 'minuto' : 'hora';
        const precio = Number(tarifa.precio).toLocaleString('es-CO');
        let impresion = { impreso: false };
        try {
            impresion = await this.printer.imprimirTicketParqueadero({
                id_ticket: ticket.idTicket,
                restaurante: settings.nombre?.trim() || restaurante?.nombre || 'Parqueadero',
                placa: vehiculo.placaCompleta || vehiculo.codigoIdentificacion,
                tipo: tipo?.nombre ?? 'Vehículo',
                entrada_en: ticket.entradaEn,
                tarifa: `Tarifa $ ${precio} / ${unidad}`,
            });
        }
        catch (err) {
            impresion = { impreso: false, error: err instanceof Error ? err.message : 'No se pudo imprimir' };
        }
        return { ...ticket, impresion };
    }
    async activos(tenantId) {
        await this.exigirModulo(tenantId);
        const rows = await this.prisma.parkingTicket.findMany({
            where: { idRestaurante: tenantId, estado: { in: ABIERTOS } },
            orderBy: { entradaEn: 'desc' },
        });
        const vehiculos = await this.prisma.parkingVehicle.findMany({
            where: { idVehiculo: { in: rows.map((r) => r.idVehiculo) } },
        });
        const porId = new Map(vehiculos.map((v) => [v.idVehiculo, v]));
        const tipos = await this.prisma.parkingVehicleType.findMany({
            where: { idTipo: { in: vehiculos.map((v) => v.idTipo) } },
        });
        const tipoPorId = new Map(tipos.map((t) => [t.idTipo, t.nombre]));
        return rows.map((t) => {
            const vehiculo = porId.get(t.idVehiculo) ?? null;
            return {
                ...t,
                vehiculo,
                tipoNombre: vehiculo ? (tipoPorId.get(vehiculo.idTipo) ?? '') : '',
            };
        });
    }
    async cotizar(tenantId, idTicket, ahora = new Date()) {
        await this.exigirModulo(tenantId);
        const ticket = await this.prisma.parkingTicket.findFirst({
            where: { idTicket, idRestaurante: tenantId },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket no encontrado');
        if (!ABIERTOS.includes(ticket.estado)) {
            return { total: Number(ticket.total), pagado: Number(ticket.pagado), saldo: 0, segundos: 0 };
        }
        const foto = ticket.tarifaFoto;
        const segundos = Math.max(0, Math.floor((ahora.getTime() - ticket.entradaEn.getTime()) / 1000));
        let total = this.liquidar(segundos, {
            precio: new client_1.Prisma.Decimal(foto.precio),
            segundosUnidad: foto.segundos_unidad,
            cobroMinimo: new client_1.Prisma.Decimal(foto.cobro_minimo),
            toleranciaSegundos: foto.tolerancia_segundos,
            modoRedondeo: foto.modo_redondeo,
        });
        if (ticket.idSuscripcion) {
            const sub = await this.prisma.parkingSubscription.findUnique({
                where: { idSuscripcion: ticket.idSuscripcion },
            });
            if (sub && sub.estado === 'ACTIVA') {
                if (ahora <= sub.venceEn && sub.modalidad === 'MULTI_ENTRY')
                    total = 0;
                else if (ahora <= sub.venceEn && sub.modalidad === 'CONTINUOUS' && !sub.usoContinuo)
                    total = 0;
                else if (ahora > sub.venceEn && ticket.politicaVencimiento === 'CHARGE_REMAINDER') {
                    const extra = Math.max(0, Math.floor((ahora.getTime() - sub.venceEn.getTime()) / 1000));
                    total = this.liquidar(extra, {
                        precio: new client_1.Prisma.Decimal(foto.precio),
                        segundosUnidad: foto.segundos_unidad,
                        cobroMinimo: new client_1.Prisma.Decimal(0),
                        toleranciaSegundos: 0,
                        modoRedondeo: foto.modo_redondeo,
                    });
                }
                else if (ahora > sub.venceEn && ticket.politicaVencimiento === 'FREE_EXIT') {
                    total = 0;
                }
            }
        }
        const descuento = Number(foto.descuento ?? 0);
        total = Math.max(0, total - descuento);
        const pagado = Number(ticket.pagado);
        return { total, pagado, saldo: Math.max(0, total - pagado), segundos, politica: ticket.politicaVencimiento };
    }
    async caja(tenantId, idUsuario, monto, motivo, tipo) {
        const ahora = new Date();
        const fecha = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
        const mov = await this.prisma.movimientoCaja.create({
            data: {
                fecha,
                tipo,
                monto,
                motivo,
                idUsuario,
            },
        });
        return mov.idMovimientoCaja;
    }
    async pagarTicket(tenantId, idUsuario, idTicket, body) {
        await this.exigirModulo(tenantId);
        if (!(body.monto > 0) || !body.idempotencia) {
            throw new common_1.BadRequestException('El pago debe ser mayor que cero y traer idempotencia');
        }
        const previo = await this.prisma.parkingTicketPayment.findUnique({
            where: { idempotencia: body.idempotencia },
        });
        if (previo)
            return previo;
        const quote = await this.cotizar(tenantId, idTicket);
        if (body.monto > quote.saldo + 0.001) {
            throw new common_1.BadRequestException('El abono supera el saldo');
        }
        const idMov = await this.caja(tenantId, idUsuario, body.monto, `PARKING_TICKET:${idTicket}`, 'entrada_manual');
        const pago = await this.prisma.parkingTicketPayment.create({
            data: {
                idTicket,
                monto: body.monto,
                metodo: body.metodo || 'efectivo',
                idUsuario,
                referencia: body.referencia,
                idempotencia: body.idempotencia,
                idMovimientoCaja: idMov,
            },
        });
        const pagado = quote.pagado + body.monto;
        await this.prisma.parkingTicket.update({
            where: { idTicket },
            data: {
                pagado,
                total: quote.total,
                estado: pagado + 0.001 >= quote.total ? 'PAID' : 'PENDING_PAYMENT',
            },
        });
        await this.audit(tenantId, idUsuario, 'pago_ticket', { idTicket, monto: body.monto });
        return pago;
    }
    async salida(tenantId, idUsuario, idTicket, decision) {
        await this.exigirModulo(tenantId);
        const ticket = await this.prisma.parkingTicket.findFirst({
            where: { idTicket, idRestaurante: tenantId },
        });
        if (!ticket || !ABIERTOS.includes(ticket.estado) && ticket?.estado !== 'PAID') {
            throw new common_1.BadRequestException('El ticket no está abierto');
        }
        let quote = await this.cotizar(tenantId, idTicket);
        if (ticket.politicaVencimiento === 'ADMIN_DECISION' && quote.saldo > 0) {
            if (!decision)
                throw new common_1.BadRequestException('Hace falta la decisión del administrador');
            if (decision === 'GRATIS')
                quote = { ...quote, total: quote.pagado, saldo: 0 };
        }
        if (quote.saldo > 0) {
            await this.prisma.parkingTicket.update({
                where: { idTicket },
                data: { total: quote.total, estado: 'PENDING_PAYMENT' },
            });
            throw new common_1.ConflictException('El ticket tiene saldo pendiente');
        }
        const cerrado = await this.prisma.parkingTicket.update({
            where: { idTicket },
            data: { estado: 'CLOSED', salidaEn: new Date(), total: quote.total },
        });
        if (ticket.idSuscripcion) {
            const sub = await this.prisma.parkingSubscription.findUnique({
                where: { idSuscripcion: ticket.idSuscripcion },
            });
            if (sub?.modalidad === 'CONTINUOUS') {
                await this.prisma.parkingSubscription.update({
                    where: { idSuscripcion: sub.idSuscripcion },
                    data: { usoContinuo: true, estado: 'CONSUMIDA' },
                });
            }
        }
        await this.audit(tenantId, idUsuario, 'salida', { idTicket });
        return cerrado;
    }
    async planes(tenantId) {
        await this.exigirModulo(tenantId);
        return this.prisma.parkingPlan.findMany({ where: { idRestaurante: tenantId, activo: true } });
    }
    async crearPlan(tenantId, body) {
        await this.exigirModulo(tenantId);
        if (body.precio < 0 || body.dias < 1)
            throw new common_1.BadRequestException('Plan inválido');
        return this.prisma.parkingPlan.create({
            data: {
                idRestaurante: tenantId,
                idTipo: body.id_tipo,
                nombre: body.nombre.trim(),
                dias: body.dias,
                precio: body.precio,
                modalidad: body.modalidad,
            },
        });
    }
    async crearSuscripcion(tenantId, idUsuario, body) {
        await this.exigirModulo(tenantId);
        const plan = await this.prisma.parkingPlan.findFirst({
            where: { idPlan: body.id_plan, idRestaurante: tenantId, activo: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        const settings = await this.settings(tenantId);
        if (settings.politicaPlanes === 'SINGLE') {
            const otra = await this.prisma.parkingSubscription.findFirst({
                where: { idVehiculo: body.id_vehiculo, estado: 'ACTIVA' },
            });
            if (otra)
                throw new common_1.ConflictException('El vehículo ya tiene un plan activo');
        }
        const pago = body.pago ?? 0;
        const precio = Number(plan.precio);
        if (pago < precio) {
            if (!body.autorizar_deuda || body.id_autorizador == null || body.id_autorizador === idUsuario) {
                throw new common_1.ForbiddenException('El plan solo se activa pagado, salvo autorización de otro administrador');
            }
        }
        const inicio = new Date();
        const vence = new Date(inicio);
        vence.setDate(vence.getDate() + plan.dias);
        const sub = await this.prisma.parkingSubscription.create({
            data: {
                idRestaurante: tenantId,
                idVehiculo: body.id_vehiculo,
                idPlan: plan.idPlan,
                modalidad: plan.modalidad,
                inicioEn: inicio,
                venceEn: vence,
                precio,
                pagado: 0,
                estado: pago >= precio ? 'ACTIVA' : 'PENDIENTE',
            },
        });
        if (pago > 0)
            await this.pagarSuscripcion(tenantId, idUsuario, sub.idSuscripcion, {
                monto: pago,
                metodo: body.metodo ?? 'efectivo',
                idempotencia: body.idempotencia,
            });
        return this.prisma.parkingSubscription.findUnique({ where: { idSuscripcion: sub.idSuscripcion } });
    }
    async pagarSuscripcion(tenantId, idUsuario, id, body) {
        await this.exigirModulo(tenantId);
        if (!(body.monto > 0))
            throw new common_1.BadRequestException('El pago debe ser mayor que cero');
        const previo = await this.prisma.parkingSubscriptionPayment.findUnique({
            where: { idempotencia: body.idempotencia },
        });
        if (previo)
            return previo;
        const sub = await this.prisma.parkingSubscription.findFirst({
            where: { idSuscripcion: id, idRestaurante: tenantId },
        });
        if (!sub)
            throw new common_1.NotFoundException('Suscripción no encontrada');
        const saldo = Number(sub.precio) - Number(sub.pagado);
        if (body.monto > saldo + 0.001)
            throw new common_1.BadRequestException('El abono supera el saldo');
        const idMov = await this.caja(tenantId, idUsuario, body.monto, `PARKING_SUBSCRIPTION:${id}`, 'entrada_manual');
        const pago = await this.prisma.parkingSubscriptionPayment.create({
            data: {
                idSuscripcion: id,
                monto: body.monto,
                metodo: body.metodo,
                idUsuario,
                idempotencia: body.idempotencia,
                idMovimientoCaja: idMov,
            },
        });
        const pagado = Number(sub.pagado) + body.monto;
        await this.prisma.parkingSubscription.update({
            where: { idSuscripcion: id },
            data: { pagado, estado: pagado + 0.001 >= Number(sub.precio) ? 'ACTIVA' : sub.estado },
        });
        return pago;
    }
    async descuento(tenantId, idUsuario, body) {
        await this.exigirModulo(tenantId);
        if (body.id_autorizador === idUsuario) {
            throw new common_1.ForbiddenException('Quien opera no puede autorizar su propio descuento');
        }
        if (!body.id_ticket)
            throw new common_1.BadRequestException('Falta el ticket');
        const quote = await this.cotizar(tenantId, body.id_ticket);
        const descuento = body.tipo === 'PORCENTAJE' ? (quote.total * body.valor) / 100 : body.valor;
        if (descuento <= 0 || descuento > quote.total) {
            throw new common_1.BadRequestException('El descuento no puede superar el importe');
        }
        const totalFinal = Math.round(quote.total - descuento);
        const ajuste = await this.prisma.parkingAdjustment.create({
            data: {
                idRestaurante: tenantId,
                idTicket: body.id_ticket,
                tipo: body.tipo,
                valor: descuento,
                importeOriginal: quote.total,
                totalFinal,
                idSolicitante: idUsuario,
                idAutorizador: body.id_autorizador,
                motivo: body.motivo.slice(0, 200),
                estado: 'APROBADO',
            },
        });
        const ticket = await this.prisma.parkingTicket.findUnique({ where: { idTicket: body.id_ticket } });
        const foto = { ...ticket?.tarifaFoto, descuento, total_final: totalFinal };
        await this.prisma.parkingTicket.update({
            where: { idTicket: body.id_ticket },
            data: { tarifaFoto: foto },
        });
        await this.audit(tenantId, idUsuario, 'descuento', { id: ajuste.idAjuste });
        return ajuste;
    }
    async suscripciones(tenantId) {
        await this.exigirModulo(tenantId);
        return this.prisma.parkingSubscription.findMany({
            where: { idRestaurante: tenantId },
            orderBy: { venceEn: 'asc' },
        });
    }
    async compatibilizar(tenantId, idA, idB) {
        await this.exigirModulo(tenantId);
        if (idA === idB)
            throw new common_1.BadRequestException('Un plan no se compatibiliza consigo mismo');
        const [a, b] = await Promise.all([
            this.prisma.parkingPlan.findFirst({ where: { idPlan: idA, idRestaurante: tenantId } }),
            this.prisma.parkingPlan.findFirst({ where: { idPlan: idB, idRestaurante: tenantId } }),
        ]);
        if (!a || !b)
            throw new common_1.NotFoundException('Plan no encontrado');
        const menor = Math.min(idA, idB);
        const mayor = Math.max(idA, idB);
        await this.prisma.parkingPlanCompatibility.createMany({
            data: [
                { idPlanA: menor, idPlanB: mayor },
                { idPlanA: mayor, idPlanB: menor },
            ],
            skipDuplicates: true,
        });
        return { ok: true };
    }
    async reportes(tenantId, desde, hasta) {
        await this.exigirModulo(tenantId);
        const inicio = desde ? new Date(desde) : new Date();
        if (!desde)
            inicio.setHours(0, 0, 0, 0);
        const fin = hasta ? new Date(hasta) : null;
        const enRango = fin ? { gte: inicio, lte: fin } : { gte: inicio };
        const ticketsTenant = await this.prisma.parkingTicket.findMany({
            where: { idRestaurante: tenantId },
            select: { idTicket: true },
        });
        const ids = ticketsTenant.map((t) => t.idTicket);
        const subsTenant = await this.prisma.parkingSubscription.findMany({
            where: { idRestaurante: tenantId },
            select: { idSuscripcion: true },
        });
        const idsSub = subsTenant.map((s) => s.idSuscripcion);
        const [estacionados, ticketsHoy, pagosHoy, planes, pendientes, descuentos, pagosPlan] = await Promise.all([
            this.prisma.parkingTicket.count({ where: { idRestaurante: tenantId, estado: { in: ABIERTOS } } }),
            this.prisma.parkingTicket.findMany({
                where: { idRestaurante: tenantId, entradaEn: enRango },
            }),
            ids.length
                ? this.prisma.parkingTicketPayment.findMany({
                    where: { creadoEn: enRango, idTicket: { in: ids } },
                })
                : Promise.resolve([]),
            this.prisma.parkingSubscription.count({
                where: { idRestaurante: tenantId, estado: 'ACTIVA', venceEn: { gt: new Date() } },
            }),
            this.prisma.parkingSubscription.findMany({
                where: { idRestaurante: tenantId, estado: { in: ['ACTIVA', 'PENDIENTE'] } },
            }),
            this.prisma.parkingAdjustment.findMany({
                where: { idRestaurante: tenantId, creadoEn: enRango },
                orderBy: { creadoEn: 'desc' },
            }),
            idsSub.length
                ? this.prisma.parkingSubscriptionPayment.findMany({
                    where: { creadoEn: enRango, idSuscripcion: { in: idsSub } },
                })
                : Promise.resolve([]),
        ]);
        const recaudado = pagosHoy.reduce((s, p) => s + Number(p.monto), 0) +
            pagosPlan.reduce((s, p) => s + Number(p.monto), 0);
        const devengado = ticketsHoy
            .filter((t) => t.estado === 'CLOSED')
            .reduce((s, t) => s + Number(t.total), 0);
        return {
            vehiculos_dentro: estacionados,
            planes_activos: planes,
            recaudado_hoy: recaudado,
            devengado_cerrado_hoy: devengado,
            saldos_planes: pendientes.map((p) => ({
                id: p.idSuscripcion,
                saldo: Number(p.precio) - Number(p.pagado),
                vence_en: p.venceEn,
                estado: p.estado,
            })),
            pagos_tickets: pagosHoy.map((p) => ({
                id_ticket: p.idTicket,
                monto: Number(p.monto),
                metodo: p.metodo,
            })),
            abonos_planes: pagosPlan.map((p) => ({
                id_suscripcion: p.idSuscripcion,
                monto: Number(p.monto),
            })),
            descuentos: descuentos.map((d) => ({
                id: d.idAjuste,
                tipo: d.tipo,
                valor: Number(d.valor),
                motivo: d.motivo,
            })),
            tickets_hoy: ticketsHoy.length,
        };
    }
};
exports.ParkingService = ParkingService;
exports.ParkingService = ParkingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        comanda_printer_service_1.ComandaPrinterService])
], ParkingService);
//# sourceMappingURL=parking.service.js.map