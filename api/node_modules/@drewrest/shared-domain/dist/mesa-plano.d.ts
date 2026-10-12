import type { MesaFormaId } from './mesa-visual';
/** Lienzo lógico del plano de un lugar (px). Igual en todos los dispositivos. */
export declare const PLANO_ANCHO = 960;
export declare const PLANO_ALTO = 900;
/** Paso del imán al soltar una mesa. */
export declare const PLANO_CUADRICULA = 20;
/** Separación entre mesas al ubicarlas automáticamente. */
export declare const PLANO_SEPARACION = 28;
/**
 * Huella de cada mesa en el plano: misma proporción que su tarjeta en Mesas, para que
 * lo que se arma en el editor sea exactamente lo que se ve en operación.
 */
export declare const PLANO_MESA_ANCHO = 104;
export declare const PLANO_MESA_ALTO = 122;
export declare function huellaMesaPlano(_forma?: MesaFormaId): {
    w: number;
    h: number;
};
export declare function ajustarPosicionPlano(x: number, y: number, forma: MesaFormaId, imantar?: boolean): {
    x: number;
    y: number;
};
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
/**
 * Primer hueco libre (recorriendo filas de izquierda a derecha) para una mesa
 * nueva sin pisar las ya ubicadas. Si el lienzo está lleno, la deja arriba a la izquierda.
 */
export declare function huecoLibrePlano(forma: MesaFormaId, ocupadas: Rect[]): {
    x: number;
    y: number;
};
export {};
