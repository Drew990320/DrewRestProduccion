"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCierreCajaEscPos = buildCierreCajaEscPos;
exports.buildBaseCajaEscPos = buildBaseCajaEscPos;
exports.buildArqueoCajaEscPos = buildArqueoCajaEscPos;
exports.buildBaseCajaCierreEscPos = buildBaseCajaCierreEscPos;
exports.buildMovimientoCajaEscPos = buildMovimientoCajaEscPos;
exports.buildItemsMenuEscPos = buildItemsMenuEscPos;
const luxon_1 = require("luxon");
const escpos_utils_1 = require("./escpos-utils");
const ticket_layout_1 = require("./ticket-layout");
function mas(monto) {
    return `+${(0, escpos_utils_1.formatCopEscPos)(monto)}`;
}
function menos(monto) {
    return `-${(0, escpos_utils_1.formatCopEscPos)(monto)}`;
}
function conSigno(monto) {
    if (monto > 0)
        return mas(monto);
    if (monto < 0)
        return menos(Math.abs(monto));
    return (0, escpos_utils_1.formatCopEscPos)(0);
}
async function fila(printer, opts, etiqueta, monto, negrita = false) {
    if (negrita)
        await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)(etiqueta, monto, opts.charWidth));
    if (negrita)
        await printer.bold(false);
}
async function filaSiHay(printer, opts, etiqueta, monto, formato) {
    if ((monto ?? 0) > 0)
        await fila(printer, opts, etiqueta, formato(monto ?? 0));
}
async function encabezadoCaja(printer, opts, titulo, fecha) {
    await (0, ticket_layout_1.encabezadoTicket)(printer, opts, {
        titulo,
        subtitulos: [(0, escpos_utils_1.ticketNombreLocal)(), (0, ticket_layout_1.fechaDiaTicket)(fecha)],
    });
}
async function bloqueArqueo(printer, opts, esperado, contado, mostrarEsperado = true) {
    const diferencia = Math.round(contado - esperado);
    if (mostrarEsperado)
        await fila(printer, opts, 'Esperado en caja', (0, escpos_utils_1.formatCopEscPos)(esperado));
    await fila(printer, opts, 'Contado', (0, escpos_utils_1.formatCopEscPos)(contado), true);
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'DIFERENCIA', conSigno(diferencia));
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, diferencia === 0 ? 'CAJA CUADRADA' : diferencia < 0 ? 'FALTANTE' : 'SOBRANTE', true);
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
}
async function lineaFirma(printer, opts) {
    await printer.newLine();
    await printer.newLine();
    await printer.alignCenter();
    await printer.println('_'.repeat(Math.min(opts.charWidth, 28)));
    await printer.println('Firma');
    await printer.alignLeft();
}
async function buildCierreCajaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const t = ticket.totales_por_metodo;
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await encabezadoCaja(printer, opts, 'CIERRE DE CAJA', ticket.fecha);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [['Impreso', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)]]);
    await (0, ticket_layout_1.separador)(printer, opts);
    await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'VENTAS');
    await fila(printer, opts, 'Total vendido', (0, escpos_utils_1.formatCopEscPos)(ticket.total_facturado), true);
    await printer.println((0, ticket_layout_1.filaDato)('Facturas', String(ticket.total_facturas), opts.charWidth));
    await fila(printer, opts, 'Efectivo', (0, escpos_utils_1.formatCopEscPos)(t.efectivo));
    await fila(printer, opts, 'Transferencia', (0, escpos_utils_1.formatCopEscPos)(ticket.transferido_recibido ?? t.transferencia));
    await filaSiHay(printer, opts, 'Tarjeta', t.tarjeta, escpos_utils_1.formatCopEscPos);
    if ((t.fiado ?? 0) > 0) {
        await fila(printer, opts, 'Crédito (por cobrar)', (0, escpos_utils_1.formatCopEscPos)(t.fiado ?? 0));
        for (const f of ticket.fiados_dia ?? []) {
            const mesa = f.mesa_numero != null ? ` · mesa ${f.mesa_numero}` : '';
            const saldo = f.saldo_pendiente > 0 ? f.saldo_pendiente : f.monto_total;
            await fila(printer, opts, `  ${f.nombre_cliente}${mesa}`, (0, escpos_utils_1.formatCopEscPos)(saldo));
        }
    }
    await (0, ticket_layout_1.separador)(printer, opts);
    await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'EFECTIVO EN CAJA');
    await fila(printer, opts, 'Base del día', mas(ticket.monto_base_efectivo));
    await fila(printer, opts, 'Ventas en efectivo', mas(t.efectivo));
    await filaSiHay(printer, opts, 'Entradas de caja', ticket.total_entradas_manual, mas);
    await filaSiHay(printer, opts, 'Pagos a meseros', ticket.total_pagos_meseros, menos);
    await filaSiHay(printer, opts, 'Salidas de caja', ticket.total_salidas_manual, menos);
    await filaSiHay(printer, opts, 'Devoluciones', ticket.total_devoluciones_efectivo, menos);
    await filaSiHay(printer, opts, 'Domicilios', ticket.total_pagos_domicilio, menos);
    await filaSiHay(printer, opts, 'Mesero (exceso)', ticket.total_pagos_mesero_exceso, menos);
    if ((ticket.subtotal_entradas_caja ?? 0) > 0 || (ticket.subtotal_salidas_caja ?? 0) > 0) {
        await (0, ticket_layout_1.separador)(printer, opts);
        await filaSiHay(printer, opts, 'Total entradas', ticket.subtotal_entradas_caja, mas);
        await filaSiHay(printer, opts, 'Total salidas', ticket.subtotal_salidas_caja, menos);
    }
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'ESPERADO EN CAJA', (0, escpos_utils_1.formatCopEscPos)(ticket.efectivo_esperado_en_caja));
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    if (ticket.monto_contado_efectivo != null) {
        await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'ARQUEO');
        await bloqueArqueo(printer, opts, ticket.efectivo_esperado_en_caja, ticket.monto_contado_efectivo, false);
    }
    else {
        await (0, ticket_layout_1.parrafoCentrado)(printer, opts, 'Arqueo pendiente: registra el efectivo contado');
        await (0, ticket_layout_1.separador)(printer, opts);
    }
    if (ticket.monto_base_cierre_efectivo != null) {
        await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'BASE FINAL');
        const retiro = retiroDeCaja(ticket.monto_contado_efectivo, ticket.monto_base_cierre_efectivo);
        if (retiro != null)
            await fila(printer, opts, 'Retiro de caja', menos(retiro));
        await fila(printer, opts, 'Queda en caja', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_base_cierre_efectivo), true);
        await (0, ticket_layout_1.separador)(printer, opts);
    }
    const entradasTr = ticket.total_entradas_manual_transferencia ?? 0;
    const salidasTr = ticket.total_salidas_manual_transferencia ?? 0;
    if (entradasTr > 0 || salidasTr > 0) {
        await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'TRANSFERENCIAS');
        await fila(printer, opts, 'Recibido por ventas', (0, escpos_utils_1.formatCopEscPos)(ticket.transferido_recibido ?? t.transferencia));
        await filaSiHay(printer, opts, 'Entradas', entradasTr, mas);
        await filaSiHay(printer, opts, 'Salidas', salidasTr, menos);
        await (0, ticket_layout_1.separador)(printer, opts);
    }
    const delDia = new Set((ticket.fiados_dia ?? []).map((f) => f.id_credito));
    const fiadosAnteriores = (ticket.fiados_pendientes ?? []).filter((f) => !delDia.has(f.id_credito));
    if (fiadosAnteriores.length > 0) {
        await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'CRÉDITOS DE OTROS DÍAS');
        for (const f of fiadosAnteriores) {
            const fecha = luxon_1.DateTime.fromISO(f.emitida_en).setZone('America/Bogota').toFormat('dd/LL');
            await fila(printer, opts, `${f.nombre_cliente} · ${fecha}`, (0, escpos_utils_1.formatCopEscPos)(f.saldo_pendiente));
        }
        await fila(printer, opts, 'Total por cobrar', (0, escpos_utils_1.formatCopEscPos)(fiadosAnteriores.reduce((s, f) => s + f.saldo_pendiente, 0)), true);
        await (0, ticket_layout_1.separador)(printer, opts);
    }
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, 'Fin del cierre');
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildBaseCajaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await encabezadoCaja(printer, opts, 'CAJA INICIAL', ticket.fecha);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ['Registrado', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)],
        ['Por', ticket.registrado_por],
    ]);
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'BASE', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_base_efectivo));
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, 'Efectivo con el que abre la caja');
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildArqueoCajaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await encabezadoCaja(printer, opts, 'ARQUEO DE CAJA', ticket.fecha);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ['Registrado', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)],
        ['Por', ticket.registrado_por],
    ]);
    await (0, ticket_layout_1.separador)(printer, opts);
    await bloqueArqueo(printer, opts, ticket.efectivo_esperado_en_caja, ticket.monto_contado_efectivo);
    await lineaFirma(printer, opts);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
function retiroDeCaja(contado, baseFinal) {
    if (contado == null)
        return null;
    return Math.max(0, Math.round(contado - baseFinal));
}
async function buildBaseCajaCierreEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const retiro = retiroDeCaja(ticket.monto_contado_efectivo, ticket.monto_base_cierre_efectivo);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await encabezadoCaja(printer, opts, 'BASE FINAL', ticket.fecha);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ['Registrado', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)],
        ['Por', ticket.registrado_por],
    ]);
    await (0, ticket_layout_1.separador)(printer, opts);
    if (ticket.monto_contado_efectivo != null) {
        await fila(printer, opts, 'Contado en arqueo', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_contado_efectivo));
    }
    if (retiro != null)
        await fila(printer, opts, 'Retiro de caja', menos(retiro));
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'BASE FINAL', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_base_cierre_efectivo));
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, 'Efectivo que queda en caja para abrir el siguiente día');
    await lineaFirma(printer, opts);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildMovimientoCajaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const esEntrada = ticket.tipo === 'entrada_manual';
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await encabezadoCaja(printer, opts, esEntrada ? 'ENTRADA DE CAJA' : 'SALIDA DE CAJA', ticket.fecha);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ['Movimiento', `#${ticket.id_movimiento}`],
        ['Registrado', (0, ticket_layout_1.fechaHoraTicket)(ticket.creado_en)],
        ['Por', ticket.registrado_por],
        ['Método', ticket.metodo === 'transferencia' ? 'Transferencia' : 'Efectivo'],
    ]);
    await (0, ticket_layout_1.separador)(printer, opts);
    await (0, ticket_layout_1.tituloSeccion)(printer, opts, 'Motivo');
    for (const line of (0, escpos_utils_1.wrapEscPos)(ticket.motivo.trim() || '-', opts.charWidth)) {
        await printer.println(line);
    }
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, esEntrada ? 'ENTRADA' : 'SALIDA', esEntrada ? mas(ticket.monto) : menos(ticket.monto));
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    if (!esEntrada)
        await lineaFirma(printer, opts);
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, `Impreso ${(0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)}`);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildItemsMenuEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await encabezadoCaja(printer, opts, 'VENTAS POR PRODUCTO', ticket.fecha);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [['Impreso', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)]]);
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, 'Subtotales antes de descuentos');
    await (0, ticket_layout_1.separador)(printer, opts);
    if (ticket.items.length === 0) {
        await (0, ticket_layout_1.parrafoCentrado)(printer, opts, 'Sin productos cobrados');
    }
    else {
        for (const item of ticket.items) {
            await fila(printer, opts, `${item.cantidad}x ${item.nombre_producto}`, (0, escpos_utils_1.formatCopEscPos)(item.subtotal));
            if (item.categoria_nombre.trim()) {
                for (const line of (0, escpos_utils_1.wrapEscPos)(`  ${item.categoria_nombre.trim()}`, opts.charWidth)) {
                    await printer.println(line);
                }
            }
        }
    }
    await (0, ticket_layout_1.separador)(printer, opts);
    await fila(printer, opts, 'Subtotal', (0, escpos_utils_1.formatCopEscPos)(ticket.subtotal_ventas_bruto));
    if (ticket.total_descuentos_dia > 0) {
        await fila(printer, opts, 'Descuentos', menos(ticket.total_descuentos_dia));
    }
    if ((ticket.total_impoconsumo_dia ?? 0) > 0) {
        await fila(printer, opts, 'Impoconsumo', (0, escpos_utils_1.formatCopEscPos)(ticket.total_impoconsumo_dia ?? 0));
    }
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'TOTAL', (0, escpos_utils_1.formatCopEscPos)(ticket.total_facturado), true);
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    const unidades = ticket.items.reduce((s, i) => s + i.cantidad, 0);
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, `${ticket.items.length} producto(s) · ${unidades} unidad(es)`);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=cierre-caja-escpos.builder.js.map