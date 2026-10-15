"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const config_restaurante_cache_1 = require("./src/restaurante/config-restaurante-cache");
const ticket_preview_samples_1 = require("./src/pedidos/ticket-preview.samples");
const windows_raw_print_1 = require("./src/pedidos/windows-raw-print");
const impresora_papel_ancho_1 = require("./src/impresoras-pos/impresora-papel-ancho");
async function main() {
    const prisma = new client_1.PrismaClient();
    const cfg = await prisma.configRestaurante.findFirst({ where: { idRestaurante: 1 } });
    if (cfg)
        (0, config_restaurante_cache_1.setCachedConfigRestaurante)(1, cfg);
    const imp = await prisma.impresoraPos.findFirstOrThrow({ where: { activa: true }, orderBy: { orden: 'asc' } });
    const t = await prisma.tienda.findFirst({
        where: { idRestaurante: 1, activo: true },
        orderBy: [{ logoArchivo: { sort: 'asc', nulls: 'last' } }, { orden: 'asc' }],
    });
    await prisma.$disconnect();
    const mm = (0, impresora_papel_ancho_1.normalizarAnchoPapelMm)(imp.anchoPapelMm);
    const opts = {
        charWidth: (0, impresora_papel_ancho_1.charsPorLineaParaPapelMm)(mm),
        papelMm: mm,
        tamanoFuente: imp.tamanoFuente,
        margenInicioLineas: imp.margenInicioLineas,
        margenFinLineas: imp.margenFinLineas,
    };
    const tienda = t ? { nombre: t.etiqueta?.trim() || t.nombre, logo_archivo: t.logoArchivo } : undefined;
    const buf = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)('venta_tienda', opts, { tienda });
    const nombre = imp.destino.replace(/^printer:/, '');
    await (0, windows_raw_print_1.printRawWindows)(nombre, buf);
    console.log(`OK venta_tienda -> ${nombre} · ${mm} mm · fuente ${imp.tamanoFuente} · tienda ${tienda?.nombre} (${buf.length} bytes)`);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=tmp-imprimir-tienda.js.map