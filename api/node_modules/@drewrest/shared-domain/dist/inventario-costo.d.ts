/**
 * Valoración de inventario: costo promedio ponderado al ingresar compras.
 */
export type EntradaCostoPromedio = Readonly<{
    stockAnterior: number;
    costoAnterior: number;
    qtyEntrada: number;
    costoEntrada: number;
}>;
/**
 * Promedio ponderado tras una compra.
 * Si stock anterior ≤ 0 o qty inválida, usa el costo de la entrada.
 */
export declare function calcularCostoPromedioPonderado(input: EntradaCostoPromedio): number;
