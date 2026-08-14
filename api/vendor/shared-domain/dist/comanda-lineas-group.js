"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notaCocinaComandaEfectiva = notaCocinaComandaEfectiva;
exports.prepararLineasComandaParaTicket = prepararLineasComandaParaTicket;
exports.lineasComandaParaTicket = lineasComandaParaTicket;
const factura_lineas_group_1 = require("./factura-lineas-group");
const cocina_producto_1 = require("./cocina-producto");
function notaCocinaComandaEfectiva(linea, catalogoPorId) {
    const propia = (0, factura_lineas_group_1.limpiarNotaCocinaTicket)(linea.nota_cocina);
    if (propia)
        return propia;
    const padreId = linea.id_detalle_combo_padre;
    if (padreId == null)
        return null;
    return (0, factura_lineas_group_1.limpiarNotaCocinaTicket)(catalogoPorId.get(padreId)?.nota_cocina);
}
/**
 * Quita el wrapper del combo si sus componentes también se imprimen, y copia
 * la nota del padre a los hijos que no tienen nota propia.
 */
function prepararLineasComandaParaTicket(catalogo, idsImprimir) {
    const byId = new Map(catalogo.map((d) => [d.id_detalle, d]));
    const printIds = idsImprimir ?? new Set(catalogo.map((d) => d.id_detalle));
    const padresConHijosImpresos = new Set();
    for (const d of catalogo) {
        if (d.id_detalle_combo_padre != null &&
            printIds.has(d.id_detalle)) {
            padresConHijosImpresos.add(d.id_detalle_combo_padre);
        }
    }
    const out = [];
    for (const d of catalogo) {
        if (!printIds.has(d.id_detalle))
            continue;
        if (padresConHijosImpresos.has(d.id_detalle))
            continue;
        out.push({
            ...d,
            nota_cocina: notaCocinaComandaEfectiva(d, byId),
        });
    }
    return out;
}
function claveComanda(d) {
    const pers = (d.personalizaciones ?? [])
        .map((p) => String(p.id_opcion ?? p.descripcion))
        .sort()
        .join(',');
    return [
        d.id_producto ?? d.nombre_producto,
        (d.nota_cocina ?? '').trim(),
        pers,
        d.id_detalle_padre ?? 'root',
    ].join('|');
}
function compararLineasComanda(a, b) {
    const ta = (0, cocina_producto_1.ordenTipoLineaCocina)((0, cocina_producto_1.tipoLineaCocina)(a));
    const tb = (0, cocina_producto_1.ordenTipoLineaCocina)((0, cocina_producto_1.tipoLineaCocina)(b));
    if (ta !== tb)
        return ta - tb;
    return a.id_detalle - b.id_detalle;
}
function lineasComandaParaTicket(detalles, opts) {
    const idsImprimir = opts?.idsImprimir
        ? new Set(opts.idsImprimir)
        : undefined;
    const preparados = prepararLineasComandaParaTicket(detalles, idsImprimir);
    const ordenados = [...preparados].sort(compararLineasComanda);
    const orden = [];
    const map = new Map();
    for (const d of ordenados) {
        const key = claveComanda(d);
        const prev = map.get(key);
        if (!prev) {
            orden.push(key);
            map.set(key, {
                id_detalle: d.id_detalle,
                cantidad: d.cantidad,
                nombre_producto: d.nombre_producto,
                nota_cocina: d.nota_cocina ?? null,
                personalizaciones: (d.personalizaciones ?? []).map((p) => p.descripcion),
                id_producto: d.id_producto,
                id_categoria: d.id_categoria,
                _ids: [d.id_detalle],
            });
            continue;
        }
        prev.cantidad += d.cantidad;
        prev._ids.push(d.id_detalle);
    }
    return orden.map((key) => {
        const row = map.get(key);
        return {
            id_detalle: row.id_detalle,
            cantidad: row.cantidad,
            nombre_producto: row.nombre_producto,
            nota_cocina: row.nota_cocina,
            personalizaciones: row.personalizaciones,
            ...(row.id_producto != null ? { id_producto: row.id_producto } : {}),
            ...(row.id_categoria != null ? { id_categoria: row.id_categoria } : {}),
        };
    });
}
