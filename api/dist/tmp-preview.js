"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const escpos_buffer_decode_1 = require("./src/pedidos/escpos-buffer-decode");
const ticket_preview_html_builder_1 = require("./src/pedidos/ticket-preview-html.builder");
(async () => {
    (0, fs_1.mkdirSync)('tmp-preview', { recursive: true });
    const cols = [];
    for (const [id, tam] of [['factura_efectivo', 1], ['comanda', 1], ['cierre_caja', 1], ['factura_efectivo', 3]]) {
        const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(id, { charWidth: 32, tamanoFuente: tam });
        const html = (0, ticket_preview_html_builder_1.segmentsToTicketPreviewHtml)(escpos_buffer_decode_1.decodeEscPosBuffer(buf, 32), { anchoMm: 58, charWidth: 32, subtitle: `${id} � letra ${tam}` });
        (0, fs_1.writeFileSync)(`tmp-preview/${id}-${tam}.html`, html);
        cols.push(`<iframe src="${id}-${tam}.html" style="width:300px;height:1100px;border:0"></iframe>`);
    }
    (0, fs_1.writeFileSync)('tmp-preview/index.html', `<html><body style="display:flex;gap:12px;background:#ddd">${cols.join('')}</body></html>`);
    console.log(process.cwd() + '\\tmp-preview\\index.html');
})();
//# sourceMappingURL=tmp-preview.js.map