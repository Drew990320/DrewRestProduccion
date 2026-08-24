"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reglaCubreLinea = reglaCubreLinea;
exports.lineaPerteneceAEstacion = lineaPerteneceAEstacion;
exports.lineaOmitidaEnEstaciones = lineaOmitidaEnEstaciones;
exports.lineasHuerfanasEstaciones = lineasHuerfanasEstaciones;
exports.destinoCatchAllHuerfanas = destinoCatchAllHuerfanas;
exports.planificarJobsComanda = planificarJobsComanda;
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
/** Líneas de cocina sin estación y sin «no imprimir». */
function lineasHuerfanasEstaciones(lineas, estaciones) {
    return lineas.filter((l) => !estaciones.some((e) => lineaPerteneceAEstacion(l, e.reglas)) &&
        !lineaOmitidaEnEstaciones(l, estaciones));
}
function esEstacionConReglas(d) {
    return !d.es_cocina_maestra && (d.reglas?.length ?? 0) > 0;
}
/**
 * Destino seguro para huérfanas: cocina maestra, o impresora sin reglas
 * (catch-all). Nunca una estación con reglas (evita carne en barra).
 */
function destinoCatchAllHuerfanas(destinos) {
    const maestra = destinos.find((d) => d.es_cocina_maestra);
    if (maestra)
        return maestra;
    return (destinos.find((d) => !d.es_cocina_maestra && (d.reglas?.length ?? 0) === 0) ?? null);
}
/**
 * Plan de impresión por zonas. No vuelca el ticket completo a la «primera»
 * estación cuando hay huérfanas u omisiones.
 */
function planificarJobsComanda(lineas, destinos) {
    const jobs = [];
    if (destinos.length === 0 || lineas.length === 0) {
        return { jobs, huerfanasSinDestino: [], todoOmitido: lineas.length === 0 };
    }
    const hayMaestra = destinos.some((d) => d.es_cocina_maestra);
    const estaciones = destinos.filter(esEstacionConReglas);
    const hayEstaciones = estaciones.length > 0;
    // Varias cocinas sin zonas: una sola comanda (la primera). Antes cada una
    // recibía el ticket completo.
    if (!hayMaestra && !hayEstaciones) {
        jobs.push({
            destinoKey: destinos[0].key,
            lineas: 'completo',
            motivo: 'compat_sin_estaciones',
        });
        return { jobs, huerfanasSinDestino: [], todoOmitido: false };
    }
    for (const d of destinos) {
        if (d.es_cocina_maestra) {
            jobs.push({ destinoKey: d.key, lineas: 'completo', motivo: 'maestra' });
            continue;
        }
        if ((d.reglas?.length ?? 0) > 0) {
            const filtradas = lineas.filter((l) => lineaPerteneceAEstacion(l, d.reglas));
            if (filtradas.length > 0) {
                jobs.push({
                    destinoKey: d.key,
                    lineas: filtradas,
                    motivo: 'estacion',
                });
            }
            continue;
        }
        // Sin reglas, con maestra/estaciones: no recibe el ticket completo.
    }
    const huerfanas = hayEstaciones && !hayMaestra
        ? lineasHuerfanasEstaciones(lineas, estaciones)
        : [];
    let huerfanasSinDestino = [];
    if (huerfanas.length > 0) {
        const catchAll = destinoCatchAllHuerfanas(destinos);
        if (catchAll && !catchAll.es_cocina_maestra) {
            // Maestra ya recibió completo; solo catch-all sin reglas recibe huérfanas.
            jobs.push({
                destinoKey: catchAll.key,
                lineas: huerfanas,
                motivo: 'catch_all_huerfanas',
            });
        }
        else if (!catchAll) {
            huerfanasSinDestino = huerfanas;
        }
        // Si hay maestra, las «huérfanas» ya van en el ticket completo; no duplicar.
    }
    const todoOmitido = jobs.length === 0 &&
        lineas.length > 0 &&
        lineas.every((l) => lineaOmitidaEnEstaciones(l, estaciones));
    return { jobs, huerfanasSinDestino, todoOmitido };
}
