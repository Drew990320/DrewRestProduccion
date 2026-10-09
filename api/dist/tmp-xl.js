"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const factura_escpos_builder_1 = require("./src/pedidos/factura-escpos.builder");
process.env.PRINTER_BEEP = '0';
(async () => {
    const t = { id_pedido: 123, id_factura: 45, mesa_etiqueta: 'Mesa 12 - Terraza', num_comensales: 2, mesero: 'Carlos Andres Perez', emitida_en: new Date().toISOString(), copia_destinatario: 'cliente', es_cobro_combinado: true,
        lineas: [{ cantidad: 2, nombre_producto: 'Bandeja paisa especial', subtotal_linea: 64000, personalizaciones: ['Sin frijoles'], nota_cocina: '' }, { cantidad: 1, nombre_producto: 'Limonada', subtotal_linea: 8000, personalizaciones: [] }],
        subtotal: 72000, total: 1072000, descuento_sopas: 0, descuento_muleros: 0, descuento_promociones: 0, metodo_pago: 'efectivo',
        vuelto_cliente: { monto_recibido_efectivo: 1100000, vuelto_efectivo: 28000, vuelto_transferencia: 0, vuelto_total: 28000 } };
    const buf = await (0, factura_escpos_builder_1.buildFacturaEscPos)(t, { charWidth: 32, tamanoFuente: 3 });
    const txt = buf.toString('latin1').replace(/\x1b[!E\-a]./g, '').replace(/\x1b[@2]/g, '').replace(/\x1d[V!]./g, '').replace(/\x1b[dM]./g, '').replace(/[\x00-\x09\x0b-\x1f]/g, '');
    const lines = txt.split('\n');
    console.log(lines.map((l) => `|${l}|${l.length > 16 ? '  <-- LARGA' : ''}`).join('\n'));
})();
//# sourceMappingURL=tmp-xl.js.map