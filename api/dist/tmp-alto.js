"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const escpos_buffer_decode_1 = require("./src/pedidos/escpos-buffer-decode");
async function main() {
    for (const t of [2, 3]) {
        const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)('precuenta', {
            charWidth: 32,
            tamanoFuente: t,
            margenInicioLineas: 0,
            margenFinLineas: 0,
            papelMm: 58,
        });
        const gs = [...buf.entries()].filter(([i, b]) => b === 0x1d && buf[i + 1] === 0x21).map(([i]) => buf[i + 2]);
        const altos = new Set((0, escpos_buffer_decode_1.decodeEscPosBuffer)(buf, 32).flatMap((s) => (s.kind === 'line' ? [s.line.alto] : [])));
        console.log(`tamaño ${t}: GS! =`, gs, 'altos =', [...altos]);
    }
}
void main();
//# sourceMappingURL=tmp-alto.js.map