"use strict";
/** Impuesto al consumo (Colombia): se suma al total sobre categorías gravadas. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.METODOS_PAGO_IMPOCONSUMO = exports.IMPOCONSUMO_PORCENTAJE_DEFECTO = void 0;
exports.tarifaImpoconsumoEfectiva = tarifaImpoconsumoEfectiva;
exports.calcularImpoconsumo = calcularImpoconsumo;
exports.normalizarMetodosImpoconsumo = normalizarMetodosImpoconsumo;
exports.metodoPagoLlevaImpoconsumo = metodoPagoLlevaImpoconsumo;
exports.tarifaImpoconsumoParaMetodo = tarifaImpoconsumoParaMetodo;
exports.etiquetaMetodoPagoImpoconsumo = etiquetaMetodoPagoImpoconsumo;
exports.etiquetaImpoconsumo = etiquetaImpoconsumo;
exports.IMPOCONSUMO_PORCENTAJE_DEFECTO = 8;
/** Tarifa efectiva: 0 si el módulo está apagado o el valor no es válido. */
function tarifaImpoconsumoEfectiva(moduloActivo, porcentaje) {
    if (!moduloActivo)
        return 0;
    const p = Number(porcentaje);
    if (!Number.isFinite(p) || p <= 0)
        return 0;
    return Math.min(100, p);
}
/**
 * Base gravable = subtotal de líneas gravadas menos su parte proporcional
 * de los descuentos. Monto en COP enteros.
 */
function calcularImpoconsumo(lineas, descuentoTotal, porcentaje) {
    if (!(porcentaje > 0) || lineas.length === 0) {
        return { base_gravable: 0, monto_impoconsumo: 0 };
    }
    let subtotal = 0;
    let gravado = 0;
    for (const l of lineas) {
        const s = Number(l.subtotal_linea) || 0;
        subtotal += s;
        if (l.aplica_impoconsumo)
            gravado += s;
    }
    if (gravado <= 0 || subtotal <= 0) {
        return { base_gravable: 0, monto_impoconsumo: 0 };
    }
    const desc = Math.max(0, Math.min(subtotal, Number(descuentoTotal) || 0));
    const descGravado = Math.round((desc * gravado) / subtotal);
    const base = Math.max(0, Math.round(gravado - descGravado));
    return {
        base_gravable: base,
        monto_impoconsumo: Math.round((base * porcentaje) / 100),
    };
}
exports.METODOS_PAGO_IMPOCONSUMO = [
    'efectivo',
    'transferencia',
    'tarjeta',
    'fiado',
];
/** Filtra valores desconocidos y duplicados. */
function normalizarMetodosImpoconsumo(raw) {
    if (!Array.isArray(raw))
        return [];
    const set = new Set(raw.map((m) => String(m).trim().toLowerCase()));
    return exports.METODOS_PAGO_IMPOCONSUMO.filter((m) => set.has(m));
}
/**
 * Si el cobro con este método lleva impoconsumo.
 * - `mixto` (efectivo + transferencia): lleva si cualquiera de los dos está marcado.
 * - `null` (método aún no elegido: precuenta, plan por personas): lleva si hay
 *   al menos un método marcado.
 */
function metodoPagoLlevaImpoconsumo(metodos, metodo) {
    const lista = normalizarMetodosImpoconsumo(metodos);
    if (lista.length === 0)
        return false;
    if (metodo == null || metodo === '')
        return true;
    const m = metodo.toLowerCase();
    if (m === 'mixto') {
        return lista.includes('efectivo') || lista.includes('transferencia');
    }
    return lista.includes(m);
}
/** Tarifa a aplicar para un método de pago concreto (0 si no lleva). */
function tarifaImpoconsumoParaMetodo(tarifaBase, metodos, metodo) {
    return tarifaBase > 0 && metodoPagoLlevaImpoconsumo(metodos, metodo)
        ? tarifaBase
        : 0;
}
function etiquetaMetodoPagoImpoconsumo(m) {
    if (m === 'efectivo')
        return 'Efectivo';
    if (m === 'transferencia')
        return 'Transferencia';
    if (m === 'tarjeta')
        return 'Tarjeta';
    return 'Fiado';
}
/** Texto de la fila en tickets y pantallas, p. ej. «Impoconsumo 8%». */
function etiquetaImpoconsumo(porcentaje) {
    const p = Number(porcentaje);
    const txt = Number.isInteger(p) ? String(p) : p.toFixed(2).replace(/\.?0+$/, '');
    return `Impoconsumo ${txt}%`;
}
