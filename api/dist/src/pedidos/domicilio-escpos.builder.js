"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDomicilioEscPos = buildDomicilioEscPos;
const escpos_utils_1 = require("./escpos-utils");
async function printCampo(printer, w, etiqueta, valor, blank, lineasExtraVacias = 0) {
    await printer.bold(true);
    await printer.println(etiqueta);
    await printer.bold(false);
    if (valor) {
        for (const line of (0, escpos_utils_1.wrapEscPos)(valor, w)) {
            await printer.println(line);
        }
    }
    else {
        await printer.println(blank);
        for (let i = 0; i < lineasExtraVacias; i++) {
            await printer.println(blank);
        }
    }
    await printer.newLine();
}
async function buildDomicilioEscPos(ticket, charWidthOrOpts = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const opts = (0, escpos_utils_1.resolveEscPosTicketOpts)(charWidthOrOpts);
    const printer = (0, escpos_utils_1.createEscPosPrinter)(opts.charWidth);
    const w = opts.charWidth;
    const rule = '='.repeat(w);
    const blank = '_'.repeat(Math.max(10, w - 2));
    const usarBlanco = ticket.forzar_blanco;
    const nombre = usarBlanco ? '' : (ticket.cliente_nombre ?? '').trim();
    const tel = usarBlanco ? '' : (ticket.cliente_telefono ?? '').trim();
    const dir = usarBlanco ? '' : (ticket.cliente_direccion ?? '').trim();
    await (0, escpos_utils_1.applyEscPosTicketStart)(printer, opts);
    await printer.alignCenter();
    await printer.println(rule);
    await printer.bold(true);
    await printer.println('DOMICILIO');
    await printer.bold(false);
    await printer.println('Datos de entrega');
    await printer.println(rule);
    await printer.newLine();
    await printer.alignLeft();
    await printCampo(printer, w, 'CLIENTE', nombre, blank);
    await printCampo(printer, w, 'TELEFONO', tel, blank);
    await printCampo(printer, w, 'DIRECCION', dir, blank, dir ? 0 : 1);
    await printer.alignCenter();
    await printer.println(rule);
    await printer.println('* * *');
    await printer.println(rule);
    await (0, escpos_utils_1.applyEscPosTicketEnd)(printer, opts);
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=domicilio-escpos.builder.js.map