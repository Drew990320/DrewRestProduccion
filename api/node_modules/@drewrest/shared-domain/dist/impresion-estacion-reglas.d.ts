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
export type DestinoPlanComanda = {
    key: string;
    es_cocina_maestra?: boolean;
    reglas?: readonly ReglaEstacionImpresion[];
};
export type JobPlanComanda<TLinea extends LineaReglaImpresion> = {
    destinoKey: string;
    /** `completo` = ticket entero; si no, solo estas líneas. */
    lineas: TLinea[] | 'completo';
    motivo: 'maestra' | 'estacion' | 'compat_sin_estaciones' | 'catch_all_huerfanas';
};
export type PlanComandaResultado<TLinea extends LineaReglaImpresion> = {
    jobs: JobPlanComanda<TLinea>[];
    /** Líneas sin estación y sin omitir, y sin destino catch-all. */
    huerfanasSinDestino: TLinea[];
    /** Todas las líneas estaban marcadas «no imprimir». */
    todoOmitido: boolean;
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
/** Líneas de cocina sin estación y sin «no imprimir». */
export declare function lineasHuerfanasEstaciones<T extends LineaReglaImpresion>(lineas: readonly T[], estaciones: ReadonlyArray<{
    reglas?: readonly ReglaEstacionImpresion[];
}>): T[];
/**
 * Destino seguro para huérfanas: cocina maestra, o impresora sin reglas
 * (catch-all). Nunca una estación con reglas (evita carne en barra).
 */
export declare function destinoCatchAllHuerfanas(destinos: readonly DestinoPlanComanda[]): DestinoPlanComanda | null;
/**
 * Plan de impresión por zonas. No vuelca el ticket completo a la «primera»
 * estación cuando hay huérfanas u omisiones.
 */
export declare function planificarJobsComanda<T extends LineaReglaImpresion>(lineas: readonly T[], destinos: readonly DestinoPlanComanda[]): PlanComandaResultado<T>;
