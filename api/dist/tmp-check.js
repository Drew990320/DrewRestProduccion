"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const escpos_buffer_decode_1 = require("./src/pedidos/escpos-buffer-decode");
(async () => {
    let errores = 0, pegadas = 0, rasterMal = 0;
    for (const w of [32, 42])
        for (const tam of [0, 1, 2, 3])
            for (const c of ticket_preview_samples_1.TICKET_PREVIEW_CATALOG) {
                let buf;
                try {
                    buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(c.id, { charWidth: w, tamanoFuente: tam });
                }
                catch (e) {
                    errores++;
                    console.log('ERR', w, tam, c.id, String(e));
                    continue;
                }
                for (let i = 0; i + 7 < buf.length; i++) {
                    if (buf[i] === 0x1d && buf[i + 1] === 0x76 && buf[i + 2] === 0x30 && buf[i + 6] === 2 && buf[i + 7] === 0) {
                        const xb = buf[i + 4] + buf[i + 5] * 256;
                        const esperado = Math.floor((w * (tam <= 0 ? 9 : 12)) / 8);
                        if (tam <= 0 ? xb !== Math.floor((Math.floor(w * 1.25) * 9) / 8) && xb !== esperado : xb !== esperado)
                            rasterMal++;
                    }
                }
                const segs = escpos_buffer_decode_1.decodeEscPosBuffer(buf, w);
                for (let i = 1; i < segs.length; i++)
                    if (segs[i].kind === 'rule' && segs[i - 1].kind === 'rule')
                        pegadas++;
                const ultimaLinea = segs.filter((s) => s.kind === 'line' && s.line.text.trim()).pop();
                if (ultimaLinea?.line.doubleWidth)
                    console.log('cuerpo qued� grande al final:', w, tam, c.id);
            }
    console.log({ errores, pegadas, rasterMal });
    const b = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)('factura_efectivo', { charWidth: 32, tamanoFuente: 1 });
    const segs = escpos_buffer_decode_1.decodeEscPosBuffer(b, 32);
    console.log(segs.map((s) => s.kind === 'line' ? `${s.line.doubleWidth ? 'G' : ' '}${s.line.alto}|${s.line.text}` : `--${s.kind}--`).join('\n'));
})();
//# sourceMappingURL=tmp-check.js.map