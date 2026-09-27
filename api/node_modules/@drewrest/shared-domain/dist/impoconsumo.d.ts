/** Impuesto al consumo (Colombia): se suma al total sobre categorías gravadas. */
export declare const IMPOCONSUMO_PORCENTAJE_DEFECTO = 8;
export type LineaImpoconsumo = {
    subtotal_linea: number;
    aplica_impoconsumo?: boolean;
};
/** Tarifa efectiva: 0 si el módulo está apagado o el valor no es válido. */
export declare function tarifaImpoconsumoEfectiva(moduloActivo: boolean | null | undefined, porcentaje: number | null | undefined): number;
/**
 * Base gravable = subtotal de líneas gravadas menos su parte proporcional
 * de los descuentos. Monto en COP enteros.
 */
export declare function calcularImpoconsumo(lineas: LineaImpoconsumo[], descuentoTotal: number, porcentaje: number): {
    base_gravable: number;
    monto_impoconsumo: number;
};
export declare const METODOS_PAGO_IMPOCONSUMO: readonly ["efectivo", "transferencia", "tarjeta", "fiado"];
export type MetodoPagoImpoconsumo = (typeof METODOS_PAGO_IMPOCONSUMO)[number];
/** Filtra valores desconocidos y duplicados. */
export declare function normalizarMetodosImpoconsumo(raw: unknown): MetodoPagoImpoconsumo[];
/**
 * Si el cobro con este método lleva impoconsumo.
 * - `mixto` (efectivo + transferencia): lleva si cualquiera de los dos está marcado.
 * - `null` (método aún no elegido: precuenta, plan por personas): lleva si hay
 *   al menos un método marcado.
 */
export declare function metodoPagoLlevaImpoconsumo(metodos: readonly string[], metodo: string | null | undefined): boolean;
/** Tarifa a aplicar para un método de pago concreto (0 si no lleva). */
export declare function tarifaImpoconsumoParaMetodo(tarifaBase: number, metodos: readonly string[], metodo: string | null | undefined): number;
export declare function etiquetaMetodoPagoImpoconsumo(m: MetodoPagoImpoconsumo): string;
/** Texto de la fila en tickets y pantallas, p. ej. «Impoconsumo 8%». */
export declare function etiquetaImpoconsumo(porcentaje: number): string;
