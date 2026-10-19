"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escpos_utils_1 = require("./src/pedidos/escpos-utils");
const escpos_buffer_decode_1 = require("./src/pedidos/escpos-buffer-decode");
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const dump = (buf) => escpos_buffer_decode_1.decodeEscPosBuffer(buf).map((s) => s.kind === 'line' ? s.line.text || '(vac�a)' : s.kind === 'rule' ? (s.doble ? '=====' : '-----') : `[${s.kind}]`).join(' / ');
(async () => {
    const p = (0, escpos_utils_1.createEscPosPrinter)(32);
    p.println('TOTAL');
    p.println('='.repeat(32));
    p.println('-'.repeat(32));
    p.println('');
    p.println('-'.repeat(32));
    p.println('Gracias');
    p.println('-'.repeat(32));
    p.println('Fin');
    console.log('prueba:', dump((0, escpos_utils_1.bufferFromPrinter)(p)));
    let total = 0;
    for (const c of ticket_preview_samples_1.TICKET_PREVIEW_CATALOG) {
        const segs = escpos_buffer_decode_1.decodeEscPosBuffer(await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(c.id, { charWidth: 32 }));
        total += segs.filter((s) => s.kind === 'rule').length;
    }
    console.log('separadores en ejemplos:', total);
})();
//# sourceMappingURL=tmp-rules.js.map