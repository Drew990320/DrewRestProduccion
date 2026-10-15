"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    const rows = await prisma.impresoraPos.findMany({ orderBy: { orden: 'asc' } });
    for (const r of rows) {
        console.log(JSON.stringify({
            id: r.idImpresora, nombre: r.nombre, destino: r.destino, activa: r.activa,
            mm: r.anchoPapelMm, fuente: r.tamanoFuente, roles: r.roles,
        }));
    }
    await prisma.$disconnect();
}
main();
//# sourceMappingURL=tmp-listar-impresoras.js.map