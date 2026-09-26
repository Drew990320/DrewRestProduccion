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
/** Texto de la fila en tickets y pantallas, p. ej. «Impoconsumo 8%». */
export declare function etiquetaImpoconsumo(porcentaje: number): string;
