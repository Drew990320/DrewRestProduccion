export type AlcanceReglaImpresion = 'categoria' | 'producto';
export type ReglaEstacionImpresion = {
    alcance: AlcanceReglaImpresion;
    id_categoria?: number | null;
    id_producto?: number | null;
    omitir?: boolean;
};
export type LineaReglaImpresion = {
    id_producto?: number | null;
    id_categoria?: number | null;
};
export declare function reglaCubreLinea(regla: ReglaEstacionImpresion, linea: LineaReglaImpresion): boolean;
/**
 * Producto omitido gana a categoría incluida.
 * Producto incluido gana a categoría omitida.
 */
export declare function lineaPerteneceAEstacion(linea: LineaReglaImpresion, reglas: readonly ReglaEstacionImpresion[] | undefined): boolean;
export declare function lineaOmitidaEnEstaciones(linea: LineaReglaImpresion, estaciones: ReadonlyArray<{
    reglas?: readonly ReglaEstacionImpresion[];
}>): boolean;
/** Líneas de cocina sin estación y sin «no imprimir»: irían a la primera impresora. */
export declare function lineasHuerfanasEstaciones<T extends LineaReglaImpresion>(lineas: readonly T[], estaciones: ReadonlyArray<{
    reglas?: readonly ReglaEstacionImpresion[];
}>): T[];
