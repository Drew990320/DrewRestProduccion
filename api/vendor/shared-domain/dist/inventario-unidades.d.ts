/**
 * Sistema de unidades y conversiones genérico (masa, volumen, conteo, empaque).
 */
export type DimensionUnidad = 'masa' | 'volumen' | 'conteo' | 'empaque';
export type UnidadCodigo = 'mg' | 'g' | 'kg' | 'ml' | 'l' | 'u' | 'porcion' | 'paquete' | 'caja' | 'bolsa' | 'bulto';
export type ConversionUnidad = Readonly<{
    unidad_origen: string;
    unidad_destino: string;
    /** cantidad_destino = cantidad_origen * factor */
    factor: number;
}>;
type UnidadDef = Readonly<{
    codigo: string;
    dimension: DimensionUnidad;
    /** Factor hacia unidad base de la dimensión (g, ml, u). */
    factor_base: number;
}>;
export declare function normalizarUnidad(unidad: string): string;
export declare function definicionUnidad(unidad: string): UnidadDef | null;
export declare function mismaDimension(unidadA: string, unidadB: string): boolean;
export type ErrorConversionUnidad = Readonly<{
    codigo: 'unidad_desconocida' | 'dimension_incompatible' | 'sin_conversion';
    mensaje: string;
}>;
export type ResultadoConversion = {
    ok: true;
    cantidad: number;
    unidad: string;
} | {
    ok: false;
    error: ErrorConversionUnidad;
};
/**
 * Convierte cantidad entre unidades.
 * 1) Catálogo estándar (g↔kg, ml↔l).
 * 2) Tabla de conversiones del negocio (ej. 1 bulto = 25 kg).
 */
export declare function convertirCantidad(cantidad: number, desde: string, hacia: string, conversiones?: readonly ConversionUnidad[]): ResultadoConversion;
/** Redondeo estable para inventario (3 decimales). */
export declare function redondearInventario(n: number): number;
/**
 * Unidad en la que se guarda el stock y descuentan las recetas: una medida real
 * (masa, volumen o conteo). Los empaques van como presentaciones del artículo.
 */
export declare function esUnidadBaseValida(unidad: string): boolean;
export declare function esUnidadEmpaque(unidad: string): boolean;
/** Forma canónica de una unidad conocida (gramos → g); si no se conoce, la deja limpia. */
export declare function unidadCanonica(unidad: string): string;
/** Cómo se compra o se cuenta un artículo: «Paquete» = 10 (en la unidad base). */
export type PresentacionArticulo = Readonly<{
    nombre: string;
    /** Cuántas unidades base trae una presentación. */
    factor: number;
}>;
/** Las presentaciones de un artículo como reglas de conversión hacia su unidad base. */
export declare function conversionesDePresentaciones(unidadBase: string, presentaciones: readonly PresentacionArticulo[]): ConversionUnidad[];
/**
 * Unidades que puede usar una receta o una entrada para este artículo:
 * la base, las de su misma dimensión (g ↔ kg) y sus presentaciones.
 */
export declare function unidadesCompatibles(unidadBase: string, presentaciones?: readonly PresentacionArticulo[]): string[];
/**
 * Stock expresado en la presentación más grande que cabe:
 * 34 u con «Paquete» = 10 → «3 paquetes + 4 u». Null si no aplica.
 */
export declare function desglosePresentacion(stock: number, unidadBase: string, presentaciones: readonly PresentacionArticulo[]): string | null;
export {};
