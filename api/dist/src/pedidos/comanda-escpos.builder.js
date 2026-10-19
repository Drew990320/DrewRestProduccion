"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComandaEscPos = buildComandaEscPos;
const escpos_utils_1 = require("./escpos-utils");
const factura_lineas_group_1 = require("./factura-lineas-group");
const ticket_layout_1 = require("./ticket-layout");
async function buildComandaEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const w = opts.charWidth;
    const sep = '-'.repeat(w);
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await (0, ticket_layout_1.encabezadoTicket)(printer, opts, {
        titulo: 'COMANDA',
        subtitulos: [ticket.estacion?.trim() && ticket.estacion.trim().toUpperCase()],
        marcas: [
            ticket.es_adicional && 'ADICIONAL',
            ticket.modo_servicio === 'para_llevar' && 'PARA LLEVAR',
            ticket.origen_autoservicio && 'AUTOSERVICIO',
            ticket.es_reimpresion && 'REIMPRESIÓN',
        ],
    });
    await printer.alignCenter();
    await (0, ticket_layout_1.textoGrande)(printer, opts, ticket.origen_autoservicio ? `TURNO #${ticket.id_pedido}` : ticket.mesa_etiqueta);
    await printer.alignLeft();
    await (0, ticket_layout_1.separador)(printer, opts);
    await (0, ticket_layout_1.bloqueDatos)(printer, opts, [
        ticket.origen_autoservicio && ['Lugar', ticket.mesa_etiqueta],
        ['Pedido', `#${ticket.id_pedido}`],
        ['Hora', (0, ticket_layout_1.fechaHoraTicket)(ticket.emitida_en)],
        !ticket.origen_autoservicio && ['Mesero', ticket.mesero],
    ]);
    await printer.println(sep);
    for (const linea of ticket.lineas) {
        await (0, ticket_layout_1.textoGrande)(printer, opts, `${linea.cantidad}x ${linea.nombre_producto}`);
        for (const p of linea.personalizaciones) {
            for (const line of (0, escpos_utils_1.wrapEscPos)(`  · ${p}`, w)) {
                await printer.println(line);
            }
        }
        const nota = (0, factura_lineas_group_1.limpiarNotaCocinaTicket)(linea.nota_cocina);
        if (nota) {
            await printer.bold(true);
            for (const line of (0, escpos_utils_1.wrapEscPos)(`  NOTA: ${nota}`, w)) {
                await printer.println(line);
            }
            await printer.bold(false);
        }
        await printer.newLine();
    }
    await printer.println(sep);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=comanda-escpos.builder.js.map