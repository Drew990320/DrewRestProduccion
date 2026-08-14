import { type LineaCocinaTipoInput } from './cocina-producto';
export type LineaComandaAgrupable = LineaCocinaTipoInput & {
    id_detalle: number;
    id_producto?: number;
    id_categoria?: number;
    id_detalle_padre: number | null;
    /** Padre del componente de combo (distinto del empaque). */
    id_detalle_combo_padre?: number | null;
    nombre_producto: string;
    cantidad: number;
    nota_cocina?: string | null;
    personalizaciones?: {
        id_opcion?: number;
        descripcion: string;
    }[];
};
export type LineaComandaTicket = {
    id_detalle: number;
    cantidad: number;
    nombre_producto: string;
    nota_cocina: string | null;
    personalizaciones: string[];
    id_producto?: number;
    id_categoria?: number;
};
export type LineasComandaParaTicketOpts = {
    /**
     * IDs que deben salir en el ticket. El resto del catálogo solo sirve
     * para heredar la nota del combo padre cuando el wrapper no se imprime.
     */
    idsImprimir?: Iterable<number>;
};
export declare function notaCocinaComandaEfectiva(linea: {
    nota_cocina?: string | null;
    id_detalle_combo_padre?: number | null;
}, catalogoPorId: ReadonlyMap<number, {
    nota_cocina?: string | null;
}>): string | null;
/**
 * Quita el wrapper del combo si sus componentes también se imprimen, y copia
 * la nota del padre a los hijos que no tienen nota propia.
 */
export declare function prepararLineasComandaParaTicket(catalogo: LineaComandaAgrupable[], idsImprimir?: ReadonlySet<number>): LineaComandaAgrupable[];
export declare function lineasComandaParaTicket(detalles: LineaComandaAgrupable[], opts?: LineasComandaParaTicketOpts): LineaComandaTicket[];
