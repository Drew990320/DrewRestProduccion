"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const tienda_logo_upload_util_1 = require("./src/tienda/tienda-logo-upload.util");
async function main() {
    const prisma = new client_1.PrismaClient();
    const ts = await prisma.tienda.findMany({ orderBy: { orden: 'asc' } });
    for (const t of ts) {
        console.log(JSON.stringify({ id: t.idTienda, nombre: t.nombre, etiqueta: t.etiqueta, activo: t.activo, logo: t.logoArchivo, ruta: (0, tienda_logo_upload_util_1.resolveTiendaLogoPath)(t.logoArchivo) }));
    }
    const cfg = await prisma.configRestaurante.findFirst({ where: { idRestaurante: 1 } });
    console.log('restaurante', cfg?.nombreComercial, cfg?.logoArchivo);
    await prisma.$disconnect();
}
main();
//# sourceMappingURL=tmp-tiendas.js.map