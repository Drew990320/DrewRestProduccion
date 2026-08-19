export type ProductoConStock = {
    activo?: boolean;
    control_stock?: boolean;
    stock_disponible?: number;
    ocultar_sin_stock?: boolean;
    usa_produccion_porciones?: boolean;
};
/** Máximo razonable para un ingreso rápido (evita ceros de más). */
export declare const INGRESO_RAPIDO_CANTIDAD_MAX = 9999;
/** Vendible con contador de menú, sin transformación por receta. */
export declare function esProductoIngresoRapidoVendible(p: ProductoConStock): boolean;
/** Cualquier vendible con stock: lote de unidades (gaseosa, porción, etc.). */
export declare function esProductoLoteVendible(p: ProductoConStock): boolean;
export declare function cantidadIngresoRapidoValida(n: number): boolean;
export declare function productoAgotado(p: ProductoConStock): boolean;
/** Si el producto debe listarse en el menú del día. */
export declare function productoVisibleEnMenu(p: ProductoConStock): boolean;
export declare function puedePedirCantidad(p: ProductoConStock, cantidad: number): boolean;
export declare function stockEtiqueta(p: ProductoConStock): string | null;
