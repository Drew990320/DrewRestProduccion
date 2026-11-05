/** Línea de pedido con producto repartible y sin reparto completo de subítems. */
export declare function sumaCantidadesSubitems(subitems: {
    cantidad: number;
}[] | null | undefined): number;
/** Unidades internas a repartir. La cantidad comercial (la que se cobra) va aparte. */
export declare function unidadesRepartoObjetivo(cantidadComercial: number, cantidadRepartoSubitems?: number | null): number;
/**
 * True si el producto usa subítems repartibles y la suma asignada
 * no coincide con las unidades a repartir (incluye suma 0 = pendiente).
 */
export declare function detalleSubitemsPendientes(d: {
    usa_subitems_repartibles?: boolean;
    cantidad: number;
    cantidad_reparto_subitems?: number | null;
    subitems?: {
        cantidad: number;
    }[] | null;
}): boolean;
