"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCodigosMenuEscPos = buildCodigosMenuEscPos;
const escpos_utils_1 = require("./escpos-utils");
async function buildCodigosMenuEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const w = opts.charWidth;
    const sep = '-'.repeat(w);
    const local = ticket.restaurante.trim() || (0, escpos_utils_1.ticketNombreLocal)();
    const fecha = new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    });
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await printer.alignCenter();
    await printer.bold(true);
    await printer.println('CODIGOS MENU');
    await printer.bold(false);
    for (const line of (0, escpos_utils_1.wrapEscPos)(local, w)) {
        await printer.println(line);
    }
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Fecha: ${fecha}`);
    await printer.println(sep);
    if (ticket.categorias.length === 0) {
        await printer.println('Sin productos con codigo');
    }
    else {
        for (const cat of ticket.categorias) {
            const catLabel = cat.codigo
                ? `${cat.codigo} ${cat.nombre}`
                : cat.nombre;
            await printer.bold(true);
            for (const line of (0, escpos_utils_1.wrapEscPos)(catLabel, w)) {
                await printer.println(line);
            }
            await printer.bold(false);
            for (const p of cat.productos) {
                const codigo = p.codigo.padEnd(4, ' ');
                const resto = Math.max(4, w - codigo.length - 1);
                const nombreLines = (0, escpos_utils_1.wrapEscPos)(p.nombre, resto);
                await printer.println(`${codigo} ${nombreLines[0] ?? ''}`);
                for (let i = 1; i < nombreLines.length; i++) {
                    await printer.println(`${' '.repeat(codigo.length + 1)}${nombreLines[i]}`);
                }
            }
            await printer.println(sep);
        }
    }
    await printer.alignCenter();
    await printer.println('Fin del listado');
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=codigos-menu-escpos.builder.js.map