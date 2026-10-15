"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const client_1 = require("@prisma/client");
const pngjs_1 = require("pngjs");
const config_restaurante_cache_1 = require("./src/restaurante/config-restaurante-cache");
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const OUT = 'C:\\Users\\nioan\\AppData\\Local\\Temp\\ticket-demo\\out';
async function main() {
    const prisma = new client_1.PrismaClient();
    const cfg = await prisma.configRestaurante.findFirst({ where: { idRestaurante: 1 } });
    if (cfg)
        (0, config_restaurante_cache_1.setCachedConfigRestaurante)(1, cfg);
    const t = await prisma.tienda.findFirst({ where: { activo: true, logoArchivo: { not: null } } });
    await prisma.$disconnect();
    const tienda = t ? { nombre: t.etiqueta?.trim() || t.nombre, logo_archivo: t.logoArchivo } : undefined;
    for (const mm of [58, 80]) {
        const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)('venta_tienda', { charWidth: mm === 80 ? 42 : 32, papelMm: mm, tamanoFuente: 1, margenInicioLineas: 0, margenFinLineas: 2 }, { tienda });
        let texto = '';
        let img = 0;
        for (let i = 0; i < buf.length;) {
            const b = buf[i];
            if (b === 0x1d && buf[i + 1] === 0x76 && buf[i + 2] === 0x30) {
                const bx = buf[i + 4] + buf[i + 5] * 256;
                const h = buf[i + 6] + buf[i + 7] * 256;
                const png = new pngjs_1.PNG({ width: bx * 8, height: h });
                for (let y = 0; y < h; y++)
                    for (let x = 0; x < bx * 8; x++) {
                        const byte = buf[i + 8 + y * bx + (x >> 3)];
                        const on = (byte >> (7 - (x & 7))) & 1;
                        const di = (y * bx * 8 + x) << 2;
                        png.data[di] = png.data[di + 1] = png.data[di + 2] = on ? 0 : 255;
                        png.data[di + 3] = 255;
                    }
                img += 1;
                fs.writeFileSync(`${OUT}\\tienda-${mm}-logo${img}.png`, pngjs_1.PNG.sync.write(png));
                texto += `[IMAGEN ${bx * 8}x${h}]\n`;
                i += 8 + bx * h;
                continue;
            }
            if (b === 0x1b || b === 0x1d) {
                i += buf[i + 1] === 0x64 || buf[i + 1] === 0x21 || buf[i + 1] === 0x61 || buf[i + 1] === 0x45 || buf[i + 1] === 0x4d || buf[i + 1] === 0x74 ? 3 : buf[i + 1] === 0x42 ? 4 : 2;
                continue;
            }
            texto += b === 0x0a ? '\n' : b >= 0x20 ? Buffer.from([b]).toString('latin1') : '';
            i += 1;
        }
        console.log(`===== ${mm} mm =====\n${texto}`);
    }
}
main();
//# sourceMappingURL=tmp-tienda-preview.js.map