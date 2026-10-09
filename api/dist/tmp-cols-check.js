"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escpos_utils_1 = require("./src/pedidos/escpos-utils");
for (const cw of [32, 42]) {
    const r = [-1, 0, 1].map((t) => `${t}:${(0, escpos_utils_1.resolveEscPosTicketOpts)({ charWidth: cw, tamanoFuente: t }).charWidth}`);
    console.log(cw === 32 ? '58mm' : '80mm', r.join('  '));
}
//# sourceMappingURL=tmp-cols-check.js.map