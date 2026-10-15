"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
function lineas(buf) {
    const out = [];
    let wide = false;
    let tall = false;
    let cur = '';
    let i = 0;
    while (i < buf.length) {
        const b = buf[i];
        if (b === 0x1b) {
            const c = buf[i + 1];
            if (c === 0x21) {
                const n = buf[i + 2];
                wide = (n & 0x20) !== 0;
                tall = (n & 0x10) !== 0;
                i += 3;
                continue;
            }
            if (c === 0x40) {
                wide = false;
                tall = false;
                i += 2;
                continue;
            }
            if (c === 0x61 || c === 0x45 || c === 0x4d || c === 0x74 || c === 0x2d || c === 0x47 || c === 0x64 || c === 0x4a || c === 0x52) {
                i += 3;
                continue;
            }
            if (c === 0x70) {
                i += 5;
                continue;
            }
            i += 2;
            continue;
        }
        if (b === 0x1d) {
            const c = buf[i + 1];
            if (c === 0x21) {
                const n = buf[i + 2];
                wide = (n & 0xf0) !== 0;
                tall = (n & 0x0f) !== 0;
                i += 3;
                continue;
            }
            if (c === 0x56) {
                i += buf[i + 2] === 0x41 || buf[i + 2] === 0x42 ? 4 : 3;
                continue;
            }
            if (c === 0x76 && buf[i + 2] === 0x30) {
                const xL = buf[i + 4], xH = buf[i + 5], yL = buf[i + 6], yH = buf[i + 7];
                i += 8 + (xL + xH * 256) * (yL + yH * 256);
                continue;
            }
            i += 3;
            continue;
        }
        if (b === 0x0a) {
            out.push({ text: cur, wide, tall });
            cur = '';
            i += 1;
            continue;
        }
        if (b >= 0x20)
            cur += String.fromCharCode(b);
        i += 1;
    }
    return out;
}
async function main() {
    for (const mm of [58, 80]) {
        const cols = mm === 80 ? 42 : 32;
        for (const tam of [0, 1, 2, 3]) {
            let problemas = 0;
            for (const c of ticket_preview_samples_1.TICKET_PREVIEW_CATALOG) {
                const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(c.id, {
                    charWidth: cols, papelMm: mm, tamanoFuente: tam, margenInicioLineas: 0, margenFinLineas: 2,
                });
                for (const l of lineas(buf)) {
                    const max = l.wide ? Math.floor(cols / 2) : cols;
                    if (l.text.length > max) {
                        problemas += 1;
                        console.log(`${mm}mm f${tam} ${c.id.padEnd(20)} ${l.wide ? 'W' : 'N'} ${l.text.length}>${max} |${l.text}|`);
                    }
                }
            }
            console.log(`== ${mm}mm fuente ${tam}: ${problemas} lineas se desbordan`);
        }
    }
}
main();
//# sourceMappingURL=tmp-audit-tamanos.js.map