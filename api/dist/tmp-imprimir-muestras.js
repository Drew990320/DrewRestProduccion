"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
async function main() {
    for (const c of ticket_preview_samples_1.TICKET_PREVIEW_CATALOG) {
        const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(c.id, { charWidth: 32, papelMm: 58, tamanoFuente: 1, margenInicioLineas: 0, margenFinLineas: 2 });
        console.log(`${c.grupo.padEnd(7)} ${c.id.padEnd(22)} ${buf.length} bytes`);
    }
}
main();
//# sourceMappingURL=tmp-imprimir-muestras.js.map