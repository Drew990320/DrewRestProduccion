"use strict";
/**
 * Cálculo de ganancias operativas por periodo (ventas − costo − gastos).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.costoEfectivoProducto = costoEfectivoProducto;
exports.prorratearGastosFijos = prorratearGastosFijos;
exports.armarResumenGanancias = armarResumenGanancias;
exports.consolidarLineasCostoVenta = consolidarLineasCostoVenta;
exports.ymdEnRango = ymdEnRango;
exports.ymdGanancias = ymd;
function costoEfectivoProducto(precioCosto, costoReceta) {
    if (precioCosto != null) {
        const manual = Number(precioCosto);
        if (Number.isFinite(manual) && manual >= 0) {
            return { costo: Math.round(manual), origen: 'manual' };
        }
    }
    if (costoReceta != null) {
        const receta = Number(costoReceta);
        if (Number.isFinite(receta) && receta >= 0) {
            return { costo: Math.round(receta), origen: 'receta' };
        }
    }
    return { costo: 0, origen: 'ninguno' };
}
function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim());
    if (!m)
        return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31)
        return null;
    return { y, m: mo, d };
}
function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function ymd(y, m, d) {
    const pad = (n) => (n < 10 ? `0${n}` : String(n));
    return `${y}-${pad(m)}-${pad(d)}`;
}
function eachYmdInclusive(desde, hasta) {
    const a = parseYmd(desde);
    const b = parseYmd(hasta);
    if (!a || !b)
        return [];
    const out = [];
    let ms = Date.UTC(a.y, a.m - 1, a.d);
    const end = Date.UTC(b.y, b.m - 1, b.d);
    if (ms > end)
        return [];
    while (ms <= end) {
        const dt = new Date(ms);
        out.push({
            y: dt.getUTCFullYear(),
            m: dt.getUTCMonth() + 1,
            d: dt.getUTCDate(),
        });
        ms += 86400000;
    }
    return out;
}
/**
 * Prorratea gastos fijos mensuales día a día en el rango [desde, hasta].
 * Cada día aporta monto_mensual / días_del_mes.
 */
function prorratearGastosFijos(gastos, fechaDesdeYmd, fechaHastaYmd) {
    const dias = eachYmdInclusive(fechaDesdeYmd, fechaHastaYmd);
    if (dias.length === 0 || gastos.length === 0) {
        return {
            total: 0,
            detalle: gastos.map((g) => ({
                id: g.id,
                nombre: g.nombre,
                monto_mensual: Math.round(Number(g.monto_mensual) || 0),
                monto_periodo: 0,
            })),
        };
    }
    const detalle = gastos.map((g) => {
        const mensual = Math.max(0, Number(g.monto_mensual) || 0);
        let acumulado = 0;
        for (const day of dias) {
            const dim = daysInMonth(day.y, day.m);
            if (dim > 0)
                acumulado += mensual / dim;
        }
        return {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(mensual),
            monto_periodo: Math.round(acumulado),
        };
    });
    const total = detalle.reduce((s, d) => s + d.monto_periodo, 0);
    return { total, detalle };
}
function armarResumenGanancias(input) {
    const ventas = Math.round(Number(input.ventas) || 0);
    const costo_ventas = input.lineas.reduce((s, l) => s + Math.round(Number(l.costo_total) || 0), 0);
    const ganancia_bruta = ventas - costo_ventas;
    const gastos_fijos = Math.round(Number(input.gastos_fijos) || 0);
    const gastos_extras = Math.round(Number(input.gastos_extras) || 0);
    const gastos_meseros = Math.round(Number(input.gastos_meseros) || 0);
    const gastos_total = gastos_fijos + gastos_extras + gastos_meseros;
    const ganancia_neta = ganancia_bruta - gastos_total;
    const unidades_vendidas = input.lineas.reduce((s, l) => s + Math.max(0, Number(l.cantidad) || 0), 0);
    const sinCosto = input.lineas.filter((l) => l.origen_costo === 'ninguno');
    const unidades_sin_costo = sinCosto.reduce((s, l) => s + Math.max(0, Number(l.cantidad) || 0), 0);
    const productos_sin_costo = new Set(sinCosto.map((l) => l.id_producto)).size;
    const margen_bruto_pct = ventas > 0
        ? Math.round((ganancia_bruta / ventas) * 10000) / 100
        : null;
    const margen_neto_pct = ventas > 0
        ? Math.round((ganancia_neta / ventas) * 10000) / 100
        : null;
    return {
        ventas,
        costo_ventas,
        ganancia_bruta,
        gastos_fijos,
        gastos_extras,
        gastos_meseros,
        gastos_total,
        ganancia_neta,
        margen_bruto_pct,
        margen_neto_pct,
        unidades_vendidas,
        unidades_sin_costo,
        productos_sin_costo,
    };
}
/** Agrupa líneas del mismo producto (suma cantidades / totales). */
function consolidarLineasCostoVenta(lineas) {
    const map = new Map();
    for (const l of lineas) {
        const prev = map.get(l.id_producto);
        if (!prev) {
            map.set(l.id_producto, { ...l });
            continue;
        }
        const cantidad = prev.cantidad + l.cantidad;
        const venta_total = prev.venta_total + l.venta_total;
        const costo_total = prev.costo_total + l.costo_total;
        const origen = prev.origen_costo === 'ninguno' || l.origen_costo === 'ninguno'
            ? 'ninguno'
            : prev.origen_costo === 'manual' || l.origen_costo === 'manual'
                ? 'manual'
                : 'receta';
        map.set(l.id_producto, {
            id_producto: l.id_producto,
            nombre: prev.nombre,
            cantidad,
            precio_venta_unitario: cantidad > 0 ? Math.round(venta_total / cantidad) : prev.precio_venta_unitario,
            costo_unitario: cantidad > 0 ? Math.round(costo_total / cantidad) : prev.costo_unitario,
            origen_costo: origen,
            venta_total,
            costo_total,
            ganancia: venta_total - costo_total,
        });
    }
    return [...map.values()].sort((a, b) => b.ganancia - a.ganancia);
}
function ymdEnRango(fechaYmd, desdeYmd, hastaYmd) {
    const f = parseYmd(fechaYmd);
    const a = parseYmd(desdeYmd);
    const b = parseYmd(hastaYmd);
    if (!f || !a || !b)
        return false;
    const ms = Date.UTC(f.y, f.m - 1, f.d);
    return ms >= Date.UTC(a.y, a.m - 1, a.d) && ms <= Date.UTC(b.y, b.m - 1, b.d);
}
