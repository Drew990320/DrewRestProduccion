"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_thermal_printer_1 = require("node-thermal-printer");
const escpos_utils_1 = require("./src/pedidos/escpos-utils");
(async () => {
    for (const t of [-1, 0]) {
        const p = new node_thermal_printer_1.ThermalPrinter({ type: node_thermal_printer_1.PrinterTypes.EPSON, interface: 'tcp://127.0.0.1:9' });
        const o = (0, escpos_utils_1.resolveEscPosTicketOpts)({ charWidth: 32, tamanoFuente: t });
        process.env.PRINTER_BEEP = '0';
        await (0, escpos_utils_1.applyEscPosTicketStart)(p, o);
        p.println('A');
        await (0, escpos_utils_1.applyEscPosTicketEnd)(p, o);
        console.log(t, o.charWidth, p.getBuffer().toString('hex').match(/../g).join(' '));
    }
})();
//# sourceMappingURL=tmp-ls.js.map