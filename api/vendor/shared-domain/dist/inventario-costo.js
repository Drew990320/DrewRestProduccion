"use strict";
/**
 * Valoración de inventario: costo promedio ponderado al ingresar compras.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularCostoPromedioPonderado = calcularCostoPromedioPonderado;
/**
 * Promedio ponderado tras una compra.
 * Si stock anterior ≤ 0 o qty inválida, usa el costo de la entrada.
 */
function calcularCostoPromedioPonderado(input) {
    const stock = Number(input.stockAnterior);
    const costoAnt = Number(input.costoAnterior);
    const qty = Number(input.qtyEntrada);
    const costoEnt = Number(input.costoEntrada);
    if (!Number.isFinite(qty) || qty <= 0) {
        return Number.isFinite(costoAnt) && costoAnt >= 0 ? costoAnt : 0;
    }
    if (!Number.isFinite(costoEnt) || costoEnt < 0) {
        return Number.isFinite(costoAnt) && costoAnt >= 0 ? costoAnt : 0;
    }
    if (!Number.isFinite(stock) || stock <= 0) {
        return costoEnt;
    }
    const costoPrev = Number.isFinite(costoAnt) && costoAnt >= 0 ? costoAnt : 0;
    const total = stock + qty;
    if (total <= 0)
        return costoEnt;
    const promedio = (stock * costoPrev + qty * costoEnt) / total;
    return Math.round(promedio * 10000) / 10000;
}
