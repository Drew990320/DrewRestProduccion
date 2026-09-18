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
exports.mimeFromTiendaLogoPath = mimeFromTiendaLogoPath;
exports.tiendaLogoPublicUrl = tiendaLogoPublicUrl;
exports.resolveTiendaLogoPath = resolveTiendaLogoPath;
exports.eliminarArchivoLogoTienda = eliminarArchivoLogoTienda;
exports.guardarArchivoLogoTienda = guardarArchivoLogoTienda;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const restaurant_branding_1 = require("../common/restaurant-branding");
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};
function inferirMime(mime, originalName) {
    const normalized = mime?.toLowerCase().split(';')[0]?.trim() ?? '';
    if (MIME_TO_EXT[normalized])
        return normalized;
    const ext = path.extname(originalName ?? '').toLowerCase();
    if (ext === '.png')
        return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg')
        return 'image/jpeg';
    if (ext === '.webp')
        return 'image/webp';
    return '';
}
function mimeFromTiendaLogoPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg')
        return 'image/jpeg';
    if (ext === '.webp')
        return 'image/webp';
    return 'image/png';
}
function tiendaLogoPublicUrl(idTienda, logoArchivo) {
    const archivo = logoArchivo?.trim();
    if (!archivo)
        return null;
    return `/tienda/tiendas/${idTienda}/logo?v=${encodeURIComponent(archivo)}`;
}
function resolveTiendaLogoPath(logoArchivo) {
    const archivo = logoArchivo?.trim();
    if (!archivo)
        return null;
    if (archivo.includes('..') || archivo.includes('/') || archivo.includes('\\')) {
        return null;
    }
    if (!/^tienda-\d+\.(png|jpg|jpeg|webp)$/i.test(archivo)) {
        return null;
    }
    const ruta = path.join((0, restaurant_branding_1.resolveImagesDir)(), archivo);
    if (!fs.existsSync(ruta))
        return null;
    return ruta;
}
function eliminarArchivoLogoTienda(logoArchivo) {
    const ruta = resolveTiendaLogoPath(logoArchivo);
    if (!ruta)
        return;
    try {
        fs.unlinkSync(ruta);
    }
    catch {
    }
}
function guardarArchivoLogoTienda(idTienda, buffer, mime, originalName) {
    if (!buffer?.length) {
        throw new common_1.BadRequestException('El archivo está vacío');
    }
    if (buffer.length > MAX_BYTES) {
        throw new common_1.BadRequestException('El logo no puede superar 5 MB');
    }
    const normalizedMime = inferirMime(mime, originalName);
    const ext = MIME_TO_EXT[normalizedMime];
    if (!ext) {
        throw new common_1.BadRequestException('Formato no admitido. Usa PNG, JPEG o WebP.');
    }
    const dir = (0, restaurant_branding_1.resolveImagesDir)();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const archivo = `tienda-${idTienda}.${ext}`;
    const ruta = path.join(dir, archivo);
    fs.writeFileSync(ruta, buffer);
    for (const otherExt of Object.values(MIME_TO_EXT)) {
        if (otherExt === ext)
            continue;
        try {
            fs.unlinkSync(path.join(dir, `tienda-${idTienda}.${otherExt}`));
        }
        catch {
        }
    }
    return { archivo, ruta };
}
//# sourceMappingURL=tienda-logo-upload.util.js.map