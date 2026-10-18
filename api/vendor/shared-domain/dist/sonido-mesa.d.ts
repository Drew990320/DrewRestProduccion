export declare const SONIDO_MESA_IDS: readonly ["campana", "timbre", "madera", "cristal", "aviso", "cocina", "suave", "doble", "ascenso", "eco"];
export type SonidoMesaId = (typeof SONIDO_MESA_IDS)[number];
export type SonidoMesaNota = {
    hz: number;
    inicio: number;
    duracion: number;
    ganancia: number;
};
export declare const SONIDO_MESA_DEFECTO: SonidoMesaId;
export declare function esSonidoMesaValido(id: string | null | undefined): id is SonidoMesaId;
export declare function resolverSonidoMesa(id: string | null | undefined): SonidoMesaId;
export declare const SONIDO_MESA_CATALOGO: Record<SonidoMesaId, {
    nombre: string;
    detalle: string;
    notas: readonly SonidoMesaNota[];
}>;
