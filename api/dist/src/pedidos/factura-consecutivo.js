"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatearNumeroFactura = formatearNumeroFactura;
exports.numeroFacturaVisible = numeroFacturaVisible;
exports.reservarConsecutivoFacturaEnTx = reservarConsecutivoFacturaEnTx;
const DIGITOS_CONSECUTIVO = 6;
function formatearNumeroFactura(prefijo, numero) {
    return `${(prefijo ?? '').trim()}${String(numero).padStart(DIGITOS_CONSECUTIVO, '0')}`;
}
function numeroFacturaVisible(f) {
    return f.numero_consecutivo != null
        ? formatearNumeroFactura(f.prefijo_consecutivo, f.numero_consecutivo)
        : String(f.id_factura);
}
async function reservarConsecutivoFacturaEnTx(tx, idRestaurante) {
    const row = await tx.configRestaurante.upsert({
        where: { idRestaurante },
        create: { idRestaurante, facturaSiguienteNumero: 2 },
        update: { facturaSiguienteNumero: { increment: 1 } },
        select: { facturaSiguienteNumero: true, facturaPrefijo: true },
    });
    return {
        numero: row.facturaSiguienteNumero - 1,
        prefijo: row.facturaPrefijo.trim(),
    };
}
//# sourceMappingURL=factura-consecutivo.js.map