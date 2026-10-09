"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
(async () => {
    const p = new client_1.PrismaClient();
    const rows = await p.$queryRawUnsafe('SELECT * FROM impresora_pos');
    console.log(rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => /id_|nombre|ancho|chars|tamano|rol|tipo|activo|margen|destino/.test(k)))));
    const v = await p.$queryRawUnsafe('SELECT logo_ticket_tamano, logo_ticket_archivo, logo_factura_archivo FROM config_visual');
    console.log(v);
    await p.$disconnect();
})();
//# sourceMappingURL=tmp-db.js.map