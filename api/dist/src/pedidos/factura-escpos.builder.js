"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFacturaEscPos = buildFacturaEscPos;
const factura_ticket_1 = require("./factura-ticket");
const factura_vuelto_1 = require("@drewrest/shared-domain/factura-vuelto");
const escpos_utils_1 = require("./escpos-utils");
const ticket_layout_1 = require("./ticket-layout");
const restaurant_branding_1 = require("../common/restaurant-branding");
function esTicketParaCliente(ticket) {
    return ticket.copia_destinatario !== 'negocio';
}
function flagsParaTicket(ticket) {
    const allOn = {
        logo: true,
        mesero: true,
        comensales: true,
        detalleItems: true,
        descuentos: true,
        metodoPago: true,
        vuelto: true,
        propina: true,
        gracias: true,
    };
    if (ticket.copia_destinatario === 'negocio')
        return allOn;
    if (ticket.es_precuenta)
        return (0, restaurant_branding_1.restaurantPrecuentaMostrarFlags)();
    return (0, restaurant_branding_1.restaurantFacturaMostrarFlags)();
}
function tituloFactura(ticket) {
    if (ticket.es_autoservicio_caja)
        return 'AUTOSERVICIO';
    if (ticket.es_precuenta)
        return 'PRECUENTA';
    if (ticket.es_total_pedido)
        return 'TOTAL DEL PEDIDO';
    return 'FACTURA';
}
function ticketEsClienteOPrecuenta(ticket) {
    if (ticket.es_total_pedido)
        return false;
    return ticket.es_precuenta === true || esTicketParaCliente(ticket);
}
function ticketLlevaLogoCliente(ticket, flags) {
    return flags.logo && ticketEsClienteOPrecuenta(ticket);
}
async function buildFacturaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const w = opts.charWidth;
    const sep = '-'.repeat(w);
    const flags = flagsParaTicket(ticket);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    if (ticketLlevaLogoCliente(ticket, flags)) {
        await (0, escpos_utils_1.printEncabezadoRestaurante)(printer, w, ticket.tienda, opts.papelMm);
    }
    await (0, ticket_layout_1.encabezadoTicket)(printer, opts, {
        titulo: tituloFactura(ticket),
        subtitulos: [
            ticket.es_autoservicio_caja && 'Por cobrar en caja',
            ticket.es_precuenta && !ticket.es_autoservicio_caja && 'No es comprobante de pago',
            ticket.es_cobro_combinado && !ticket.es_cobro_parcial && 'Cobro combinado (esta tanda)',
            ticket.es_cuota_combinado && 'Ítems seleccionados (referencia)',
            ticket.es_cuota_personas && 'Pedido completo (referencia)',
        ],
        marcas: [
            ticket.copia_destinatario === 'negocio' && 'COPIA NEGOCIO',
            ticket.copia_destinatario === 'cliente' && 'COPIA CLIENTE',
            ticket.es_cobro_parcial && 'COBRO PARCIAL',
            ticket.es_registro_posterior && 'REGISTRO POSTERIOR',
            ticket.es_reimpresion && 'REIMPRESIÓN',
        ],
    });
    if (ticket.es_autoservicio_caja) {
        await printer.alignCenter();
        await (0, ticket_layout_1.textoGrande)(printer, opts, `TURNO #${ticket.id_pedido}`);
        await printer.alignLeft();
        await (0, ticket_layout_1.separador)(printer, opts);
    }
    if (!ticket.tienda) {
        await printer.bold(true);
        for (const line of (0, escpos_utils_1.wrapEscPos)(ticket.mesa_etiqueta, w)) {
            await printer.println(line);
        }
        await printer.bold(false);
    }
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ticket.id_factura != null &&
            !ticket.es_precuenta && [
            'Factura No.',
            ticket.numero_factura ?? String(ticket.id_factura),
        ],
        ['Pedido', `#${ticket.id_pedido}`],
        ['Fecha', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)],
        flags.mesero && [ticket.tienda ? 'Vendedor' : 'Mesero', ticket.mesero],
        ticket.modo_servicio === 'para_llevar' && ['Servicio', 'Para llevar'],
    ]);
    await printer.println(sep);
    if (flags.detalleItems) {
        for (const linea of ticket.lineas) {
            const titulo = `${linea.cantidad}x ${linea.nombre_producto}`;
            const sinPrecioLinea = ticket.es_cuota_personas || ticket.es_cuota_combinado;
            if (sinPrecioLinea) {
                for (const tl of (0, escpos_utils_1.wrapEscPos)(titulo, w)) {
                    await printer.println(tl);
                }
            }
            else {
                await printer.println((0, escpos_utils_1.lineaConPrecio)(titulo, (0, escpos_utils_1.formatCopEscPos)(linea.subtotal_linea), w));
            }
            for (const p of linea.personalizaciones) {
                for (const line of (0, escpos_utils_1.wrapEscPos)(`  · ${p}`, w)) {
                    await printer.println(line);
                }
            }
            if (linea.nota_cocina?.trim()) {
                for (const line of (0, escpos_utils_1.wrapEscPos)(`  Nota: ${linea.nota_cocina.trim()}`, w)) {
                    await printer.println(line);
                }
            }
        }
        await printer.println(sep);
    }
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Subtotal', (0, escpos_utils_1.formatCopEscPos)(ticket.subtotal), w));
    if (flags.descuentos) {
        if (ticket.descuento_sopas > 0) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)((0, restaurant_branding_1.restaurantEtiquetasDescuento)().sopas, `-${(0, escpos_utils_1.formatCopEscPos)(ticket.descuento_sopas)}`, w));
        }
        if (ticket.descuento_muleros > 0) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)((0, restaurant_branding_1.restaurantEtiquetasDescuento)().muleros, `-${(0, escpos_utils_1.formatCopEscPos)(ticket.descuento_muleros)}`, w));
        }
        if (ticket.promociones_desglose && ticket.promociones_desglose.length > 0) {
            for (const p of ticket.promociones_desglose) {
                if (p.monto <= 0)
                    continue;
                await printer.println((0, escpos_utils_1.lineaConPrecio)(`Desc. ${p.etiqueta}`, `-${(0, escpos_utils_1.formatCopEscPos)(p.monto)}`, w));
            }
        }
        else if (ticket.descuento_promociones > 0) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)('Desc. promociones', `-${(0, escpos_utils_1.formatCopEscPos)(ticket.descuento_promociones)}`, w));
        }
    }
    if (ticket.monto_impoconsumo && ticket.monto_impoconsumo > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)(ticket.etiqueta_impoconsumo ?? 'Impoconsumo', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_impoconsumo), w));
    }
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'TOTAL', (0, escpos_utils_1.formatCopEscPos)(ticket.total), true);
    await (0, ticket_layout_1.separadorDoble)(printer, opts);
    if (flags.metodoPago) {
        if (ticket.es_precuenta) {
            await printer.println((0, ticket_layout_1.filaDato)('Estado', 'Pendiente de cobro', w));
        }
        else if (ticket.metodo_pago === 'mixto' && ticket.cobros_resumen?.length) {
            await printer.println('Cobros:');
            for (const c of ticket.cobros_resumen) {
                await printer.println((0, escpos_utils_1.lineaConPrecio)(`  ${(0, factura_ticket_1.labelMetodoPago)(c.metodo_pago)}`, (0, escpos_utils_1.formatCopEscPos)(c.total), w));
            }
            await printer.println((0, ticket_layout_1.filaDato)('Pago', (0, factura_ticket_1.labelMetodoPago)('mixto'), w));
        }
        else if (ticket.cobros_resumen && ticket.cobros_resumen.length > 1) {
            await printer.println('Cobros:');
            for (const c of ticket.cobros_resumen) {
                await printer.println((0, escpos_utils_1.lineaConPrecio)(`  ${(0, factura_ticket_1.labelMetodoPago)(c.metodo_pago)}`, (0, escpos_utils_1.formatCopEscPos)(c.total), w));
            }
        }
        else {
            await printer.println((0, ticket_layout_1.filaDato)('Pago', (0, factura_ticket_1.labelMetodoPago)(ticket.metodo_pago), w));
        }
        if (ticket.fiado_cliente) {
            await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
                ['Cliente crédito', ticket.fiado_cliente],
                ['Teléfono', ticket.fiado_telefono],
            ]);
        }
    }
    if (flags.vuelto) {
        if (!ticket.es_precuenta &&
            !ticket.es_total_pedido &&
            ticket.detalle_exceso_cobro) {
            const lineas = (0, factura_vuelto_1.lineasTicketExcesoCobro)(ticket.detalle_exceso_cobro);
            if (lineas.length > 0) {
                await printer.println(sep);
                for (const l of lineas) {
                    if (l.destacado) {
                        await (0, ticket_layout_1.filaMontoGrande)(printer, opts, l.etiqueta, (0, escpos_utils_1.formatCopEscPos)(l.monto));
                    }
                    else {
                        await printer.println((0, escpos_utils_1.lineaConPrecio)(l.etiqueta, (0, escpos_utils_1.formatCopEscPos)(l.monto), w));
                    }
                }
            }
        }
        else if (!ticket.es_precuenta &&
            !ticket.es_total_pedido &&
            ticket.vuelto_cliente &&
            ticket.vuelto_cliente.vuelto_total > 0) {
            const v = ticket.vuelto_cliente;
            await printer.println(sep);
            if (v.monto_recibido_efectivo != null && v.monto_recibido_efectivo > 0) {
                await printer.println((0, escpos_utils_1.lineaConPrecio)('Recibido efectivo', (0, escpos_utils_1.formatCopEscPos)(v.monto_recibido_efectivo), w));
            }
            if (v.monto_transferencia_recibido != null &&
                v.monto_transferencia_recibido > 0) {
                await printer.println((0, escpos_utils_1.lineaConPrecio)('Recibido transfer.', (0, escpos_utils_1.formatCopEscPos)(v.monto_transferencia_recibido), w));
            }
            await printer.bold(true);
            if (v.vuelto_efectivo > 0 && v.vuelto_transferencia > 0) {
                await printer.println((0, escpos_utils_1.lineaConPrecio)('Vuelto efectivo', (0, escpos_utils_1.formatCopEscPos)(v.vuelto_efectivo), w));
                await printer.println((0, escpos_utils_1.lineaConPrecio)('Vuelto transfer.', (0, escpos_utils_1.formatCopEscPos)(v.vuelto_transferencia), w));
            }
            await printer.bold(false);
            await (0, ticket_layout_1.filaMontoGrande)(printer, opts, 'VUELTO', (0, escpos_utils_1.formatCopEscPos)(v.vuelto_total));
        }
    }
    const conPropina = flags.propina && esTicketParaCliente(ticket) && !ticket.tienda;
    if (conPropina || flags.gracias)
        await printer.println(sep);
    if (conPropina) {
        await (0, ticket_layout_1.parrafoCentrado)(printer, opts, (0, restaurant_branding_1.restaurantTextoPropinaTicket)(), true);
    }
    if (flags.gracias) {
        await (0, ticket_layout_1.parrafoCentrado)(printer, opts, (0, restaurant_branding_1.restaurantTextoGraciasTicket)());
    }
    if (ticketEsClienteOPrecuenta(ticket)) {
        await (0, escpos_utils_1.printPieDrewTechFactura)(printer, w);
    }
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=factura-escpos.builder.js.map