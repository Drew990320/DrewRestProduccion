/** Resumen de tienda retail (API / UI). */
export type TiendaResumen = {
    id_tienda: number;
    nombre: string;
    etiqueta: string | null;
    activo: boolean;
    numero_mesa_boutique: number;
    orden: number;
};
/** Valida nombre de tienda para crear/editar. */
export declare function validarNombreTienda(nombre: string | null | undefined): {
    ok: true;
    nombre: string;
} | {
    ok: false;
    mensaje: string;
};
/** Números de mesa boutique de una lista de tiendas (para etiquetas / reservas). */
export declare function numerosMesaBoutiqueDeTiendas(tiendas: Array<{
    numero_mesa_boutique: number;
    activo?: boolean;
}> | null | undefined, soloActivas?: boolean): number[];
