"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escpos_utils_1 = require("./src/pedidos/escpos-utils");
(async () => {
    const p = (0, escpos_utils_1.createEscPosPrinter)(42);
    await (0, escpos_utils_1.applyEscPosFontSize)(p, 0);
    p.println('A');
    p.setTextDoubleHeight();
    p.println('TITULO');
    p.setTextNormal();
    p.println('B');
    const hex = Buffer.from(p.getBuffer()).toString('hex').match(/../g).join(' ');
    console.log(hex);
})();
//# sourceMappingURL=tmp-fontb-check.js.map