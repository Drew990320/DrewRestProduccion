import { type ConversionUnidad } from './inventario-unidades';
import type { MovimientoInventarioPlan } from './inventario-movimientos';
export type SustitucionReceta = Readonly<{
    id_articulo: number;
    /** Multiplicador sobre la cantidad de la línea original (1 = misma cantidad). */
    factor?: number;
}>;
export type RecetaLinea = Readonly<{
    id_linea: string;
    id_articulo?: number;
    id_subreceta?: string;
    cantidad: number;
    unidad: string;
    opcional?: boolean;
    sustituciones?: readonly SustitucionReceta[];
}>;
export type Receta = Readonly<{
    id_receta: string;
    id_producto?: number;
    version?: number;
    lineas: readonly RecetaLinea[];
}>;
export type ArticuloInventarioReceta = Readonly<{
    id_articulo: number;
    unidad_stock: string;
    costo_unitario?: number;
    activo?: boolean;
    /** Presentaciones propias del artículo (tienen prioridad sobre las del negocio). */
    conversiones?: readonly ConversionUnidad[];
}>;
export type ErrorReceta = Readonly<{
    codigo: 'linea_sin_articulo' | 'articulo_desconocido' | 'subreceta_desconocida' | 'conversion_fallida' | 'receta_vacia';
    mensaje: string;
    id_linea?: string;
}>;
export type ResultadoConsumoReceta = {
    ok: true;
    movimientos: MovimientoInventarioPlan[];
    costo_total: number;
} | {
    ok: false;
    errores: ErrorReceta[];
};
/** Agrupa deltas del mismo artículo en un solo movimiento planificado. */
export declare function consolidarMovimientos(movimientos: readonly MovimientoInventarioPlan[]): MovimientoInventarioPlan[];
export declare function calcularConsumoReceta(receta: Receta, porciones: number, articulos: ReadonlyMap<number, ArticuloInventarioReceta>, recetas?: ReadonlyMap<string, Receta>, conversiones?: readonly ConversionUnidad[], sustitucionesPorLinea?: ReadonlyMap<string, number>): ResultadoConsumoReceta;
export type ArticuloRecetaConStock = ArticuloInventarioReceta & Readonly<{
    cantidad_actual: number;
}>;
export type SustitucionAplicada = Readonly<{
    id_linea: string;
    id_principal: number;
    /** Alterno usado; null si ninguno alcanzaba y se descontó el principal igual. */
    id_sustituto: number | null;
    /** Lo que se necesitaba del principal, en su unidad de stock. */
    requerido_principal: number;
    disponible_principal: number;
}>;
/**
 * Decide, por línea, si se descuenta el principal o un alterno según el stock vivo.
 * Orden: principal si alcanza → primer alterno que alcance → principal igual (queda negativo).
 * `reservado` acumula lo ya comprometido (otras líneas del mismo pedido) y se actualiza.
 */
export declare function elegirSustitucionesPorStock(receta: Receta, porciones: number, articulos: ReadonlyMap<number, ArticuloRecetaConStock>, recetas?: ReadonlyMap<string, Receta>, conversiones?: readonly ConversionUnidad[], reservado?: Map<number, number>): {
    elegidas: Map<string, number>;
    aplicadas: SustitucionAplicada[];
};
export declare function calcularCostoReceta(receta: Receta, articulos: ReadonlyMap<number, ArticuloInventarioReceta>, recetas?: ReadonlyMap<string, Receta>, conversiones?: readonly ConversionUnidad[]): number;
