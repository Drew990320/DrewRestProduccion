"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeEscPosBuffer = decodeEscPosBuffer;
const escpos_utils_1 = require("./escpos-utils");
const CP1252_ALTOS = [
    '€', '?', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '?', 'Ž', '?',
    '?', '‘', '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '?', 'ž', 'Ÿ',
];
function decodeEscPosBuffer(buffer, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const segments = [];
    let align = 'left';
    let bold = false;
    let doubleWidth = false;
    let alto = 1;
    let textBuf = '';
    const flushLine = () => {
        const text = textBuf.replace(/\r/g, '');
        textBuf = '';
        if (text.length === 0) {
            segments.push({
                kind: 'line',
                line: { text: '', align, bold, doubleWidth, doubleHeight: alto >= 2, alto },
            });
            return;
        }
        const trimmed = text.trim();
        if (trimmed.length >= Math.max(8, charWidth - 4) &&
            /^[-\u2500=]+$/.test(trimmed)) {
            segments.push({ kind: 'rule', doble: /^=+$/.test(trimmed) });
            return;
        }
        segments.push({
            kind: 'line',
            line: { text, align, bold, doubleWidth, doubleHeight: alto >= 2, alto },
        });
    };
    let i = 0;
    while (i < buffer.length) {
        const b = buffer[i];
        if (b === 0x0a) {
            flushLine();
            i += 1;
            continue;
        }
        if (b === 0x0d) {
            i += 1;
            continue;
        }
        if (b === 0x1b) {
            if (i + 1 >= buffer.length)
                break;
            const cmd = buffer[i + 1];
            if (cmd === 0x40) {
                i += 2;
                continue;
            }
            if (cmd === 0x61 && i + 2 < buffer.length) {
                const n = buffer[i + 2];
                align = n === 1 ? 'center' : n === 2 ? 'right' : 'left';
                i += 3;
                continue;
            }
            if (cmd === 0x45 && i + 2 < buffer.length) {
                bold = buffer[i + 2] === 1;
                i += 3;
                continue;
            }
            if (cmd === 0x21 && i + 2 < buffer.length) {
                const n = buffer[i + 2];
                alto = (n & 0x10) !== 0 ? 2 : 1;
                doubleWidth = (n & 0x20) !== 0;
                i += 3;
                continue;
            }
            if ((cmd === 0x74 || cmd === 0x4d || cmd === 0x2d || cmd === 0x4a) &&
                i + 2 < buffer.length) {
                i += 3;
                continue;
            }
            if (cmd === 0x42) {
                i += 4;
                continue;
            }
            if (cmd === 0x70) {
                i += 5;
                continue;
            }
            if (cmd === 0x64 && i + 2 < buffer.length) {
                const n = buffer[i + 2];
                for (let k = 0; k < n; k++) {
                    segments.push({
                        kind: 'line',
                        line: { text: '', align, bold, doubleWidth, doubleHeight: alto >= 2, alto },
                    });
                }
                i += 3;
                continue;
            }
            i += 2;
            continue;
        }
        if (b === 0x1d) {
            if (i + 1 >= buffer.length)
                break;
            const cmd = buffer[i + 1];
            if (cmd === 0x21 && i + 2 < buffer.length) {
                const n = buffer[i + 2];
                alto = (n & 0x07) + 1;
                doubleWidth = (n & 0x10) !== 0;
                i += 3;
                continue;
            }
            if (cmd === 0x56) {
                const m = buffer[i + 2];
                const largo = m === 0x41 || m === 0x42 ? 4 : 3;
                i += Math.min(largo, buffer.length - i);
                continue;
            }
            if (cmd === 0x42 && i + 2 < buffer.length) {
                i += 3;
                continue;
            }
            if (cmd === 0x76 && i + 7 < buffer.length && buffer[i + 2] === 0x30) {
                const xL = buffer[i + 4];
                const xH = buffer[i + 5];
                const yL = buffer[i + 6];
                const yH = buffer[i + 7];
                const widthBytes = xL + xH * 256;
                const height = yL + yH * 256;
                const dataLen = widthBytes * height;
                if (textBuf.length > 0)
                    flushLine();
                segments.push(height <= 4 ? { kind: 'rule' } : { kind: 'logo' });
                i += 8 + dataLen;
                continue;
            }
            i += 2;
            continue;
        }
        if (b >= 0x20) {
            textBuf += b >= 0x80 && b <= 0x9f ? (CP1252_ALTOS[b - 0x80] ?? '?') : String.fromCharCode(b);
            i += 1;
            continue;
        }
        i += 1;
    }
    if (textBuf.length > 0)
        flushLine();
    return segments;
}
//# sourceMappingURL=escpos-buffer-decode.js.map