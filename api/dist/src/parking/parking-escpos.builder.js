"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildParkingEntradaEscPos = buildParkingEntradaEscPos;
const escpos_utils_1 = require("../pedidos/escpos-utils");
const ticket_layout_1 = require("../pedidos/ticket-layout");
async function buildParkingEntradaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await (0, ticket_layout_1.encabezadoTicket)(printer, opts, {
        titulo: 'PARQUEADERO',
        subtitulos: ['Entrada', ticket.restaurante],
    });
    await (0, ticket_layout_1.separador)(printer, opts);
    await printer.alignCenter();
    await printer.bold(true);
    await (0, ticket_layout_1.textoTitulo)(printer, opts, ticket.placa);
    await printer.bold(false);
    await printer.println(ticket.tipo);
    await printer.alignLeft();
    await printer.newLine();
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ['Ticket', `#${ticket.id_ticket}`],
        ['Entrada', (0, ticket_layout_1.fechaHoraTicket)(ticket.entrada_en)],
        ['Tarifa', ticket.tarifa],
    ]);
    await (0, ticket_layout_1.separador)(printer, opts);
    await printer.alignCenter();
    await printer.println('Conserve este ticket.');
    await printer.println('Se presenta al salir.');
    await printer.alignLeft();
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=parking-escpos.builder.js.map