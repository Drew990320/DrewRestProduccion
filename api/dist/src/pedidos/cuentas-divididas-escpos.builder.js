"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCuentasDivididasEscPos = buildCuentasDivididasEscPos;
const escpos_utils_1 = require("./escpos-utils");
const comanda_ticket_1 = require("./comanda-ticket");
const factura_ticket_1 = require("./factura-ticket");
const ticket_layout_1 = require("./ticket-layout");
function metodoLabel(m) {
    return (0, factura_ticket_1.labelMetodoPago)(m);
}
async function buildCuentasDivididasEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const w = opts.charWidth;
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await (0, ticket_layout_1.encabezadoTicket)(printer, opts, {
        titulo: 'CUENTAS DIVIDIDAS',
        subtitulos: [(0, escpos_utils_1.ticketNombreLocal)(), (0, ticket_layout_1.fechaDiaTicket)(ticket.fecha)],
    });
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [['Impreso', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)]]);
    await (0, ticket_layout_1.separador)(printer, opts);
    for (const ped of ticket.pedidos) {
        await (0, ticket_layout_1.tituloSeccion)(printer, opts, `${ped.mesa_etiqueta || (0, comanda_ticket_1.etiquetaMesaComanda)(ped.mesa_numero)} · Pedido #${ped.id_pedido}`);
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Total pedido', (0, escpos_utils_1.formatCopEscPos)(ped.total_pedido), w));
        for (const f of ped.facturas) {
            const hora = (0, ticket_layout_1.fechaHoraTicket)(f.emitida_en).slice(-5);
            const parcial = f.es_parcial ? ' (parcial)' : '';
            await printer.println((0, escpos_utils_1.lineaConPrecio)(`  Pago ${f.tanda}${parcial}`, (0, escpos_utils_1.formatCopEscPos)(f.total), w));
            await printer.println(`    ${metodoLabel(f.metodo_pago)} · ${hora}`);
        }
        await (0, ticket_layout_1.separador)(printer, opts);
    }
    await (0, ticket_layout_1.parrafoCentrado)(printer, opts, `${ticket.pedidos.length} pedido(s) con cuenta dividida`);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=cuentas-divididas-escpos.builder.js.map