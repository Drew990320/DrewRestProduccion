"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentsToTicketPreviewHtml = segmentsToTicketPreviewHtml;
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function segmentsToTicketPreviewHtml(segments, opts) {
    const anchoMm = opts?.anchoMm === 80 ? 80 : 58;
    const cols = Math.max(16, Math.round(opts?.charWidth ?? (anchoMm === 80 ? 42 : 32)));
    const logoMaxH = Math.max(40, Math.min(800, Math.round(opts?.logoMaxHeightPx ?? 220)));
    const lines = [];
    if (opts?.subtitle?.trim()) {
        lines.push(`<div class="subtitle">${escapeHtml(opts.subtitle.trim())}</div>`);
    }
    let logoPuesto = false;
    for (const seg of segments) {
        if (seg.kind === 'logo') {
            if (opts?.logoDataUrl && !logoPuesto) {
                lines.push(`<img class="logo" src="${opts.logoDataUrl}" alt="Logo" />`);
                logoPuesto = true;
            }
            continue;
        }
        if (seg.kind === 'rule') {
            lines.push(seg.doble ? '<hr class="rule doble" />' : '<hr class="rule" />');
            continue;
        }
        const { line } = seg;
        const cls = [
            'line',
            line.align !== 'left' ? `align-${line.align}` : '',
            line.bold ? 'bold' : '',
            line.doubleHeight ? 'tall' : '',
            line.doubleWidth ? 'wide' : '',
        ]
            .filter(Boolean)
            .join(' ');
        const text = line.text.trim() ? escapeHtml(line.text) : '&nbsp;';
        lines.push(line.alto >= 3 && !line.doubleWidth
            ? `<div class="${cls}" style="line-height:${1.35 * line.alto}"><span style="transform:scaleY(${line.alto})">${text}</span></div>`
            : line.doubleHeight && !line.doubleWidth
                ? `<div class="${cls}"><span>${text}</span></div>`
                : `<div class="${cls}">${text}</div>`);
    }
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vista previa ticket ${anchoMm} mm</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: #ececec;
      font-family: "Courier New", Courier, monospace;
      display: flex;
      justify-content: center;
    }
    .ticket {
      width: ${anchoMm}mm;
      max-width: 100%;
      background: #fff;
      color: #111;
      padding: 10px 8px 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,.12);
      /* Courier mide 0.6em por carácter: así caben exactamente ${cols} columnas. */
      font-size: calc((${anchoMm}mm - 16px) / ${(cols * 0.6).toFixed(2)});
      line-height: 1.35;
    }
    .subtitle {
      text-align: center;
      color: #666;
      font-family: system-ui, sans-serif;
      font-size: 9px;
      margin-bottom: 8px;
    }
    .logo {
      display: block;
      width: auto;
      max-width: 100%;
      height: auto;
      max-height: ${logoMaxH}px;
      object-fit: contain;
      margin: 0 auto 8px;
    }
    .line { white-space: pre; overflow: hidden; }
    .line.align-center { text-align: center; }
    .line.align-right { text-align: right; }
    .line.bold { font-weight: 700; }
    /* Doble alto: mismo ancho de columna, letra estirada en vertical. */
    .line.tall { line-height: 2.7; }
    .line.tall > span { display: inline-block; transform: scaleY(2); transform-origin: center; line-height: 1.35; }
    /* Doble alto y ancho: mitad de columnas, letra al doble. */
    .line.tall.wide { font-size: 2em; line-height: 1.3; }
    .line.wide:not(.tall) { font-size: 2em; line-height: 1.35; }
    hr.rule {
      border: none;
      border-top: 1px dashed #999;
      margin: 6px 0;
    }
    hr.rule.doble {
      border-top: 3px double #555;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .ticket { box-shadow: none; width: ${anchoMm}mm; }
    }
  </style>
</head>
<body>
  <div class="ticket">${lines.join('\n')}</div>
</body>
</html>`;
}
//# sourceMappingURL=ticket-preview-html.builder.js.map