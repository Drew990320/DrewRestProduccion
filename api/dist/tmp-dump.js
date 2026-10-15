"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
async function main() {
    const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)('factura_efectivo', {
        charWidth: 32, papelMm: 58, tamanoFuente: 3, margenInicioLineas: 0, margenFinLineas: 2,
    });
    let out = '';
    for (const b of buf) {
        if (b === 0x0a)
            out += '\\n\n';
        else if (b >= 0x20 && b < 0x7f)
            out += String.fromCharCode(b);
        else
            out += `<${b.toString(16).padStart(2, '0')}>`;
    }
    console.log(out);
}
main();
//# sourceMappingURL=tmp-dump.js.map