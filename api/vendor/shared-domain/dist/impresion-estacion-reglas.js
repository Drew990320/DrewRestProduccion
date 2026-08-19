"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reglaCubreLinea = reglaCubreLinea;
exports.lineaPerteneceAEstacion = lineaPerteneceAEstacion;
exports.lineaOmitidaEnEstaciones = lineaOmitidaEnEstaciones;
exports.lineasHuerfanasEstaciones = lineasHuerfanasEstaciones;
function idNum(v) {
    if (v == null)
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function reglaCubreLinea(regla, linea) {
    const idProd = idNum(linea.id_producto);
    const idCat = idNum(linea.id_categoria);
    if (regla.alcance === 'producto') {
        const rid = idNum(regla.id_producto);
        return rid != null && idProd != null && rid === idProd;
    }
    if (regla.alcance === 'categoria') {
        const rid = idNum(regla.id_categoria);
        return rid != null && idCat != null && rid === idCat;
    }
    return false;
}
/**
 * Producto omitido gana a categoría incluida.
 * Producto incluido gana a categoría omitida.
 */
function lineaPerteneceAEstacion(linea, reglas) {
    const list = reglas ?? [];
    if (list.length === 0)
        return false;
    const omits = list.filter((r) => r.omitir);
    const includes = list.filter((r) => !r.omitir);
    if (includes.length === 0)
        return false;
    if (omits.some((r) => r.alcance === 'producto' && reglaCubreLinea(r, linea))) {
        return false;
    }
    if (includes.some((r) => r.alcance === 'producto' && reglaCubreLinea(r, linea))) {
        return true;
    }
    if (omits.some((r) => r.alcance === 'categoria' && reglaCubreLinea(r, linea))) {
        return false;
    }
    return includes.some((r) => r.alcance === 'categoria' && reglaCubreLinea(r, linea));
}
function lineaOmitidaEnEstaciones(linea, estaciones) {
    return estaciones.some((est) => (est.reglas ?? []).some((r) => r.omitir === true && reglaCubreLinea(r, linea)));
}
/** Líneas de cocina sin estación y sin «no imprimir»: irían a la primera impresora. */
function lineasHuerfanasEstaciones(lineas, estaciones) {
    return lineas.filter((l) => !estaciones.some((e) => lineaPerteneceAEstacion(l, e.reglas)) &&
        !lineaOmitidaEnEstaciones(l, estaciones));
}
