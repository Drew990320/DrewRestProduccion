"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escposBufferToPdf = escposBufferToPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const escpos_buffer_decode_1 = require("./escpos-buffer-decode");
const escpos_utils_1 = require("./escpos-utils");
const impresora_papel_ancho_1 = require("../impresoras-pos/impresora-papel-ancho");
const MM_TO_PT = 72 / 25.4;
const PAD_PT = 5;
const BASE_FONT_SIZE = 7.2;
const LINE_HEIGHT = BASE_FONT_SIZE * 1.28;
function pickFont(bold) {
    return bold ? 'Courier-Bold' : 'Courier';
}
function pngSizeFromBuffer(buf) {
    if (buf.length < 24)
        return null;
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
        return null;
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width < 1 || height < 1 || width > 10000 || height > 10000)
        return null;
    return { width, height };
}
function pageMetrics(anchoMm) {
    const pageWidthPt = anchoMm * MM_TO_PT;
    return {
        pageWidthPt,
        contentWPt: pageWidthPt - PAD_PT * 2,
    };
}
function renderSegments(doc, segments, metrics, logoPng, subtitle) {
    let y = PAD_PT;
    const { pageWidthPt, contentWPt } = metrics;
    const ensureSpace = (h) => {
        const maxY = doc.page.height - PAD_PT;
        if (y + h > maxY) {
            doc.addPage({
                size: [pageWidthPt, 720],
                margins: { top: PAD_PT, bottom: PAD_PT, left: PAD_PT, right: PAD_PT },
            });
            y = PAD_PT;
        }
    };
    if (subtitle?.trim()) {
        doc
            .font('Helvetica')
            .fontSize(5.5)
            .fillColor('#666666')
            .text(subtitle.trim(), PAD_PT, y, { width: contentWPt, align: 'center' });
        y += 9;
    }
    for (const seg of segments) {
        if (seg.kind === 'logo') {
            if (logoPng) {
                try {
                    const size = pngSizeFromBuffer(logoPng);
                    const w = contentWPt;
                    const h = size
                        ? Math.max(12, (size.height / Math.max(1, size.width)) * w)
                        : 52;
                    ensureSpace(h + 4);
                    doc.image(logoPng, PAD_PT, y, { width: w });
                    y += h + 4;
                }
                catch {
                }
            }
            continue;
        }
        if (seg.kind === 'rule') {
            ensureSpace(LINE_HEIGHT);
            doc
                .moveTo(PAD_PT, y + LINE_HEIGHT * 0.45)
                .lineTo(pageWidthPt - PAD_PT, y + LINE_HEIGHT * 0.45)
                .strokeColor('#999999')
                .lineWidth(0.5)
                .stroke();
            y += LINE_HEIGHT;
            continue;
        }
        const { line } = seg;
        const size = BASE_FONT_SIZE *
            (line.doubleHeight ? 1.3 : 1) *
            (line.doubleWidth ? 1.05 : 1);
        const h = LINE_HEIGHT * (line.doubleHeight ? 1.25 : 1);
        ensureSpace(h);
        doc
            .font(pickFont(line.bold))
            .fontSize(size)
            .fillColor('#111111')
            .text(line.text || ' ', PAD_PT, y, {
            width: contentWPt,
            align: line.align,
            lineBreak: false,
        });
        y += h;
    }
}
function escposBufferToPdf(buffer, opts) {
    const charWidth = opts?.charWidth ?? escpos_utils_1.DEFAULT_ESC_POS_WIDTH;
    const anchoMm = opts?.anchoMm ?? (0, impresora_papel_ancho_1.papelMmDesdeChars)(charWidth);
    const metrics = pageMetrics(anchoMm);
    const segments = (0, escpos_buffer_decode_1.decodeEscPosBuffer)(buffer, charWidth);
    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new pdfkit_1.default({
            size: [metrics.pageWidthPt, 720],
            margins: { top: PAD_PT, bottom: PAD_PT, left: PAD_PT, right: PAD_PT },
            autoFirstPage: true,
            info: {
                Title: `Vista previa ticket POS ${anchoMm} mm`,
                Producer: 'DrewRest',
            },
        });
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        renderSegments(doc, segments, metrics, opts?.logoPng, opts?.subtitle);
        doc.end();
    });
}
//# sourceMappingURL=ticket-preview-pdf.js.map