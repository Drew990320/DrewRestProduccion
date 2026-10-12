"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANO_MESA_ALTO = exports.PLANO_MESA_ANCHO = exports.PLANO_SEPARACION = exports.PLANO_CUADRICULA = exports.PLANO_ALTO = exports.PLANO_ANCHO = void 0;
exports.huellaMesaPlano = huellaMesaPlano;
exports.ajustarPosicionPlano = ajustarPosicionPlano;
exports.huecoLibrePlano = huecoLibrePlano;
/** Lienzo lógico del plano de un lugar (px). Igual en todos los dispositivos. */
exports.PLANO_ANCHO = 960;
exports.PLANO_ALTO = 900;
/** Paso del imán al soltar una mesa. */
exports.PLANO_CUADRICULA = 20;
/** Separación entre mesas al ubicarlas automáticamente. */
exports.PLANO_SEPARACION = 28;
/**
 * Huella de cada mesa en el plano: misma proporción que su tarjeta en Mesas, para que
 * lo que se arma en el editor sea exactamente lo que se ve en operación.
 */
exports.PLANO_MESA_ANCHO = 104;
exports.PLANO_MESA_ALTO = 122;
function huellaMesaPlano(_forma) {
    return { w: exports.PLANO_MESA_ANCHO, h: exports.PLANO_MESA_ALTO };
}
function ajustarPosicionPlano(x, y, forma, imantar = false) {
    const { w, h } = huellaMesaPlano(forma);
    const snap = (v) => (imantar ? Math.round(v / exports.PLANO_CUADRICULA) * exports.PLANO_CUADRICULA : v);
    return {
        x: Math.min(Math.max(0, snap(x)), exports.PLANO_ANCHO - w),
        y: Math.min(Math.max(0, snap(y)), exports.PLANO_ALTO - h),
    };
}
function chocan(a, b, margen) {
    return (a.x < b.x + b.w + margen &&
        b.x < a.x + a.w + margen &&
        a.y < b.y + b.h + margen &&
        b.y < a.y + a.h + margen);
}
/**
 * Primer hueco libre (recorriendo filas de izquierda a derecha) para una mesa
 * nueva sin pisar las ya ubicadas. Si el lienzo está lleno, la deja arriba a la izquierda.
 */
function huecoLibrePlano(forma, ocupadas) {
    const { w, h } = huellaMesaPlano(forma);
    const paso = exports.PLANO_CUADRICULA;
    for (let y = exports.PLANO_CUADRICULA; y + h <= exports.PLANO_ALTO; y += paso) {
        for (let x = exports.PLANO_CUADRICULA; x + w <= exports.PLANO_ANCHO; x += paso) {
            const r = { x, y, w, h };
            if (!ocupadas.some((o) => chocan(r, o, exports.PLANO_SEPARACION / 2)))
                return { x, y };
        }
    }
    return { x: 0, y: 0 };
}
