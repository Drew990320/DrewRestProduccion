"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comanda_escpos_builder_1 = require("./src/pedidos/comanda-escpos.builder");
const escpos_buffer_decode_1 = require("./src/pedidos/escpos-buffer-decode");
(async () => {
    const buf = await (0, comanda_escpos_builder_1.buildComandaEscPos)({ id_pedido: 1, mesa_etiqueta: 'Mesa 1', mesero: 'Ana', emitida_en: new Date().toISOString(), lineas: [{ cantidad: 2, nombre_producto: 'Bandeja', personalizaciones: [], nota_cocina: null }], num_comensales: 2 }, { charWidth: 32, margenFinLineas: 0 });
    console.log('tail', [...buf.subarray(buf.length - 11)].map((b) => b.toString(16)).join(' '));
    console.log('ultimas', JSON.stringify(escpos_buffer_decode_1.decodeEscPosBuffer(buf).slice(-2)));
})();
//# sourceMappingURL=tmp-cut-check.js.map