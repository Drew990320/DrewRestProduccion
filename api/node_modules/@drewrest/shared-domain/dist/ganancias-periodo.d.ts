/**
 * Cálculo de ganancias operativas por periodo (ventas − costo − gastos).
 */
export type OrigenCostoProducto = 'manual' | 'receta' | 'ninguno';
export declare function costoEfectivoProducto(precioCosto: number | null | undefined, costoReceta: number | null | undefined): {
    costo: number;
    origen: OrigenCostoProducto;
};
export type GastoFijoParaProrrateo = Readonly<{
    id: number;
    nombre: string;
    monto_mensual: number;
}>;
export type GastoFijoProrrateado = Readonly<{
    id: number;
    nombre: string;
    monto_mensual: number;
    monto_periodo: number;
}>;
declare function ymd(y: number, m: number, d: number): string;
/**
 * Prorratea gastos fijos mensuales día a día en el rango [desde, hasta].
 * Cada día aporta monto_mensual / días_del_mes.
 */
export declare function prorratearGastosFijos(gastos: readonly GastoFijoParaProrrateo[], fechaDesdeYmd: string, fechaHastaYmd: string): {
    total: number;
    detalle: GastoFijoProrrateado[];
};
export type LineaCostoVenta = Readonly<{
    id_producto: number;
    nombre: string;
    cantidad: number;
    precio_venta_unitario: number;
    costo_unitario: number;
    origen_costo: OrigenCostoProducto;
    venta_total: number;
    costo_total: number;
    ganancia: number;
}>;
export type ResumenGananciasPeriodo = Readonly<{
    ventas: number;
    costo_ventas: number;
    ganancia_bruta: number;
    gastos_fijos: number;
    gastos_extras: number;
    gastos_meseros: number;
    gastos_total: number;
    ganancia_neta: number;
    margen_bruto_pct: number | null;
    margen_neto_pct: number | null;
    unidades_vendidas: number;
    unidades_sin_costo: number;
    productos_sin_costo: number;
}>;
export declare function armarResumenGanancias(input: {
    ventas: number;
    lineas: readonly LineaCostoVenta[];
    gastos_fijos: number;
    gastos_extras: number;
    gastos_meseros?: number;
}): ResumenGananciasPeriodo;
/** Agrupa líneas del mismo producto (suma cantidades / totales). */
export declare function consolidarLineasCostoVenta(lineas: readonly LineaCostoVenta[]): LineaCostoVenta[];
export declare function ymdEnRango(fechaYmd: string, desdeYmd: string, hastaYmd: string): boolean;
export { ymd as ymdGanancias };
