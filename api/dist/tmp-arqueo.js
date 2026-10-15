"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const escpos_buffer_decode_1 = require("./src/pedidos/escpos-buffer-decode");
async function main() {
    for (const tipo of ['arqueo_caja', 'base_caja_cierre', 'cierre_caja']) {
        const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(tipo, {
            charWidth: 32,
            tamanoFuente: 1,
            margenInicioLineas: 0,
            margenFinLineas: 0,
            papelMm: 58,
        });
        console.log(`\n##### ${tipo}`);
        for (const s of (0, escpos_buffer_decode_1.decodeEscPosBuffer)(buf, 32)) {
            if (s.kind === 'rule')
                console.log(s.doble ? '='.repeat(32) : '-'.repeat(32));
            else if (s.kind === 'logo')
                console.log('[logo]');
            else
                console.log((s.line.bold ? '*' : ' ') + s.line.text);
        }
    }
}
void main();
//# sourceMappingURL=tmp-arqueo.js.map