"use strict";
/**
 * Cálculo de ganancias operativas por periodo (ventas − costo − gastos).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.costoEfectivoProducto = costoEfectivoProducto;
exports.ymdInclusiveList = ymdInclusiveList;
exports.parsePeriodicidadGasto = parsePeriodicidadGasto;
exports.cuotaDiariaSugerida = cuotaDiariaSugerida;
exports.persistenciaMontoFijo = persistenciaMontoFijo;
exports.topeFondoAlcanzado = topeFondoAlcanzado;
exports.disponibleFondo = disponibleFondo;
exports.montoPagoFondoSugerido = montoPagoFondoSugerido;
exports.rangoMesCalendario = rangoMesCalendario;
exports.sumarCuotasAplicadas = sumarCuotasAplicadas;
exports.debeAutoAplicarCuota = debeAutoAplicarCuota;
exports.parseModoRegistroFondo = parseModoRegistroFondo;
exports.gastoFijoUsaRegistroDiario = gastoFijoUsaRegistroDiario;
exports.montoDiarioFijo = montoDiarioFijo;
exports.montoExtraEnPeriodo = montoExtraEnPeriodo;
exports.extraAplicaEnPeriodo = extraAplicaEnPeriodo;
exports.armarGastosFijosPeriodo = armarGastosFijosPeriodo;
exports.prorratearGastosFijos = prorratearGastosFijos;
exports.armarResumenGanancias = armarResumenGanancias;
exports.consolidarLineasCostoVenta = consolidarLineasCostoVenta;
exports.ymdEnRango = ymdEnRango;
exports.agruparVentasPorMetodoPago = agruparVentasPorMetodoPago;
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
function ymdInclusiveList(desde, hasta) {
    return eachYmdInclusive(desde, hasta).map((day) => ymd(day.y, day.m, day.d));
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
function parsePeriodicidadGasto(raw, fallback) {
    return raw === 'diario' || raw === 'mensual' ? raw : fallback;
}
/** Cuota sugerida: monto mensual / 30, en pesos enteros. */
function cuotaDiariaSugerida(montoMensual) {
    return Math.max(0, Math.round((Number(montoMensual) || 0) / 30));
}
/** El UI envía el monto del chip (mes o día); en BD el mensual sirve de tope/meta. */
function persistenciaMontoFijo(input) {
    const m = Math.max(0, Math.round(Number(input.monto_ingresado) || 0));
    if (input.periodicidad === 'diario') {
        return { monto_mensual: m * 30, monto_diario: m };
    }
    return { monto_mensual: m, monto_diario: cuotaDiariaSugerida(m) };
}
function topeFondoAlcanzado(acumuladoMes, montoMensual) {
    return Math.round(Number(acumuladoMes) || 0) >= Math.round(Number(montoMensual) || 0);
}
/** Lo que queda en el sobre: cuotas aplicadas − pagos ya hechos con el fondo. */
function disponibleFondo(acumulado, pagado) {
    return Math.max(0, Math.round(Number(acumulado) || 0) - Math.round(Number(pagado) || 0));
}
/** Sugiere pagar lo que falta de la meta del mes, sin pasar el disponible. */
function montoPagoFondoSugerido(input) {
    const disp = Math.max(0, Math.round(Number(input.disponible) || 0));
    const falta = Math.max(0, Math.round(Number(input.monto_mensual) || 0) -
        Math.round(Number(input.pagado_mes) || 0));
    if (falta <= 0)
        return 0;
    return Math.min(disp, falta);
}
function rangoMesCalendario(fechaYmd) {
    const p = parseYmd(fechaYmd);
    if (!p)
        return null;
    const dim = daysInMonth(p.y, p.m);
    return { desde: ymd(p.y, p.m, 1), hasta: ymd(p.y, p.m, dim) };
}
function sumarCuotasAplicadas(cuotas, idGastoFijo, fechaDesdeYmd, fechaHastaYmd) {
    let total = 0;
    for (const c of cuotas) {
        if (c.id_gasto_fijo !== idGastoFijo)
            continue;
        if (c.estado && c.estado !== 'aplicada')
            continue;
        if (!ymdEnRango(c.fecha, fechaDesdeYmd, fechaHastaYmd))
            continue;
        total += Math.max(0, Math.round(Number(c.monto) || 0));
    }
    return total;
}
/**
 * Auto-aplica solo si el fondo está on, modo automático, no hay decisión
 * del día y el acumulado del mes aún no cubre la meta.
 */
function debeAutoAplicarCuota(input) {
    if (!input.usa_fondo_diario)
        return false;
    if (input.activo === false)
        return false;
    if (input.modo_registro_fondo !== 'automatico')
        return false;
    if (input.estado_hoy === 'aplicada' || input.estado_hoy === 'omitida') {
        return false;
    }
    if (Math.round(Number(input.cuota_diaria) || 0) <= 0)
        return false;
    if (input.periodicidad !== 'diario' &&
        topeFondoAlcanzado(input.acumulado_mes, input.monto_mensual)) {
        return false;
    }
    return true;
}
function parseModoRegistroFondo(raw) {
    return raw === 'confirmar' ? 'confirmar' : 'automatico';
}
/** Fondo, o diario en modo “puede variar”: hay que registrar (o saltar) el día. */
function gastoFijoUsaRegistroDiario(g) {
    if (g.usa_fondo_diario)
        return true;
    return (parsePeriodicidadGasto(g.periodicidad, 'mensual') === 'diario' &&
        parseModoRegistroFondo(g.modo_registro_fondo) === 'confirmar');
}
function montoDiarioFijo(g) {
    if (g.cuota_diaria != null) {
        return Math.max(0, Math.round(Number(g.cuota_diaria) || 0));
    }
    return cuotaDiariaSugerida(g.monto_mensual);
}
/** Extra diario: cuenta el día. Extra mensual: prorratea el mes de `fecha` en el rango. */
function montoExtraEnPeriodo(input) {
    const monto = Math.max(0, Math.round(Number(input.monto) || 0));
    const per = parsePeriodicidadGasto(input.periodicidad, 'diario');
    if (per === 'diario') {
        return ymdEnRango(input.fecha, input.fecha_desde, input.fecha_hasta)
            ? monto
            : 0;
    }
    const mes = rangoMesCalendario(input.fecha);
    if (!mes)
        return 0;
    const dim = eachYmdInclusive(mes.desde, mes.hasta).length;
    if (dim <= 0)
        return 0;
    const dias = eachYmdInclusive(input.fecha_desde, input.fecha_hasta);
    let overlap = 0;
    for (const day of dias) {
        const s = ymd(day.y, day.m, day.d);
        if (s >= mes.desde && s <= mes.hasta)
            overlap += 1;
    }
    if (overlap <= 0)
        return 0;
    return Math.round((monto / dim) * overlap);
}
function extraAplicaEnPeriodo(input) {
    const per = parsePeriodicidadGasto(input.periodicidad, 'diario');
    if (per === 'diario') {
        return ymdEnRango(input.fecha, input.fecha_desde, input.fecha_hasta);
    }
    const mes = rangoMesCalendario(input.fecha);
    if (!mes)
        return false;
    const dias = eachYmdInclusive(input.fecha_desde, input.fecha_hasta);
    return dias.some((day) => {
        const s = ymd(day.y, day.m, day.d);
        return s >= mes.desde && s <= mes.hasta;
    });
}
/**
 * Mensual sin fondo: prorrateo.
 * Diario cuota fija sin fondo: monto × días del rango.
 * Fondo o diario “puede variar”: solo días registrados/aplicados.
 */
function armarGastosFijosPeriodo(gastos, cuotasAplicadas, fechaDesdeYmd, fechaHastaYmd) {
    const mes = rangoMesCalendario(fechaHastaYmd);
    const dias = eachYmdInclusive(fechaDesdeYmd, fechaHastaYmd);
    const sinFondoMensual = gastos.filter((g) => !g.usa_fondo_diario &&
        parsePeriodicidadGasto(g.periodicidad, 'mensual') !== 'diario');
    const prorrateo = prorratearGastosFijos(sinFondoMensual.map((g) => ({
        id: g.id,
        nombre: g.nombre,
        monto_mensual: g.monto_mensual,
    })), fechaDesdeYmd, fechaHastaYmd);
    const porId = new Map();
    for (const d of prorrateo.detalle) {
        const g = sinFondoMensual.find((x) => x.id === d.id);
        porId.set(d.id, {
            ...d,
            usa_fondo_diario: false,
            cuota_diaria: g?.cuota_diaria ?? null,
            acumulado_mes: 0,
            periodicidad: 'mensual',
        });
    }
    for (const g of gastos) {
        if (g.usa_fondo_diario)
            continue;
        if (parsePeriodicidadGasto(g.periodicidad, 'mensual') !== 'diario')
            continue;
        if (parseModoRegistroFondo(g.modo_registro_fondo) === 'confirmar')
            continue;
        const daily = montoDiarioFijo(g);
        porId.set(g.id, {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(Number(g.monto_mensual) || 0),
            monto_periodo: daily * dias.length,
            usa_fondo_diario: false,
            cuota_diaria: daily,
            acumulado_mes: 0,
            periodicidad: 'diario',
        });
    }
    for (const g of gastos) {
        if (!gastoFijoUsaRegistroDiario(g))
            continue;
        const monto_periodo = sumarCuotasAplicadas(cuotasAplicadas, g.id, fechaDesdeYmd, fechaHastaYmd);
        const acumulado_mes = mes
            ? sumarCuotasAplicadas(cuotasAplicadas, g.id, mes.desde, mes.hasta)
            : monto_periodo;
        porId.set(g.id, {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(Number(g.monto_mensual) || 0),
            monto_periodo,
            usa_fondo_diario: g.usa_fondo_diario,
            cuota_diaria: g.cuota_diaria != null
                ? Math.max(0, Math.round(Number(g.cuota_diaria) || 0))
                : null,
            acumulado_mes,
            periodicidad: parsePeriodicidadGasto(g.periodicidad, 'mensual'),
        });
    }
    const detalle = gastos.map((g) => {
        const d = porId.get(g.id);
        if (d)
            return d;
        return {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(Number(g.monto_mensual) || 0),
            monto_periodo: 0,
            usa_fondo_diario: g.usa_fondo_diario,
            cuota_diaria: g.cuota_diaria != null
                ? Math.max(0, Math.round(Number(g.cuota_diaria) || 0))
                : null,
            acumulado_mes: 0,
            periodicidad: parsePeriodicidadGasto(g.periodicidad, 'mensual'),
        };
    });
    const total = detalle.reduce((s, d) => s + d.monto_periodo, 0);
    return { total, detalle };
}
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
function agruparVentasPorMetodoPago(facturas) {
    const out = {
        efectivo: 0,
        transferencia: 0,
        tarjeta: 0,
        fiado: 0,
        otros: 0,
        total: 0,
    };
    for (const f of facturas) {
        const t = Math.round(Number(f.total) || 0);
        out.total += t;
        const m = String(f.metodo_pago ?? '')
            .toLowerCase()
            .trim();
        if (m === 'efectivo')
            out.efectivo += t;
        else if (m === 'transferencia')
            out.transferencia += t;
        else if (m === 'tarjeta')
            out.tarjeta += t;
        else if (m === 'fiado')
            out.fiado += t;
        else
            out.otros += t;
    }
    return out;
}
