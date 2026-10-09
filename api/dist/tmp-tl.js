"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const factura_escpos_builder_1 = require("./src/pedidos/factura-escpos.builder");
process.env.PRINTER_BEEP = '0';
(async () => {
    const t = { id_pedido: 9, mesa_etiqueta: 'Venta tienda', num_comensales: 1, mesero: 'Ana', emitida_en: new Date().toISOString(), es_precuenta: true, modo_servicio: 'en_mesa',
        lineas: [], subtotal: 0, total: 0, descuento_sopas: 0, descuento_muleros: 0, descuento_promociones: 0, tienda: { nombre: 'Tienda', logo_archivo: 'tienda-1.jpg' } };
    for (const [cw, tf] of [[32, 0], [32, 1], [42, 0]]) {
        const buf = await (0, factura_escpos_builder_1.buildFacturaEscPos)(t, { charWidth: cw, tamanoFuente: tf });
        const i = buf.indexOf(Buffer.from([0x1d, 0x76, 0x30]));
        console.log(`chars ${cw} fuente ${tf} -> imagen ancho px:`, (buf[i + 4] + buf[i + 5] * 256) * 8);
    }
})();
//# sourceMappingURL=tmp-tl.js.map