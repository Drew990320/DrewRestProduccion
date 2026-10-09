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
const path = __importStar(require("path"));
const escpos_utils_1 = require("./src/pedidos/escpos-utils");
const { PNG } = require('pngjs');
const umbral = (img) => { for (let i = 0; i < img.data.length; i += 4) {
    const g = 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2];
    const v = img.data[i + 3] > 126 && g < 128 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
} return img; };
(async () => {
    const p = path.join(process.cwd(), 'images', 'tienda-1.jpg');
    const buf = await (0, escpos_utils_1.combinarLogosLadoALado)(p, p, 384, 160);
    const out = path.join(process.env.TEMP, 'logos-impreso-tramado.png');
    fs.writeFileSync(out, PNG.sync.write(umbral(PNG.sync.read(buf))));
    const { leerImagenComoPngBuffer } = await Promise.resolve().then(() => __importStar(require('./src/visual/image-png.util')));
    console.log(out);
})();
//# sourceMappingURL=tmp-cmb.js.map