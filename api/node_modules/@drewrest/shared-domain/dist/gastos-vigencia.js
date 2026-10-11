"use strict";
/**
 * Vigencia de gastos fijos: desde/hasta qué fecha cuentan y qué días de la semana.
 * Máscara de días: bit 0 = lunes … bit 6 = domingo (ISO).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIAS_SEMANA_NOMBRE = exports.DIAS_SEMANA_CORTO = exports.DIAS_SEMANA_LUN_VIE = exports.DIAS_SEMANA_LUN_SAB = exports.DIAS_SEMANA_TODOS = void 0;
exports.sumarDiasYmd = sumarDiasYmd;
exports.indiceDiaSemana = indiceDiaSemana;
exports.normalizarDiasSemana = normalizarDiasSemana;
exports.diaSemanaActivo = diaSemanaActivo;
exports.alternarDiaSemana = alternarDiaSemana;
exports.gastoAplicaEnDia = gastoAplicaEnDia;
exports.diasQueAplican = diasQueAplican;
exports.diasAplicablesEnMes = diasAplicablesEnMes;
exports.describirDiasSemana = describirDiasSemana;
exports.describirVigencia = describirVigencia;
exports.rangoPeriodoAnterior = rangoPeriodoAnterior;
exports.variacionPct = variacionPct;
const resumen_periodo_1 = require("./resumen-periodo");
exports.DIAS_SEMANA_TODOS = 0b1111111;
exports.DIAS_SEMANA_LUN_SAB = 0b0111111;
exports.DIAS_SEMANA_LUN_VIE = 0b0011111;
/** Lunes primero, como el calendario. */
exports.DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
exports.DIAS_SEMANA_NOMBRE = [
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
    'domingo',
];
const DIAS_SEMANA_ABREV = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim());
    if (!m)
        return null;
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}
function utcMs(ymd) {
    const p = parseYmd(ymd);
    return p ? Date.UTC(p.y, p.m - 1, p.d) : null;
}
function ymdFromMs(ms) {
    const d = new Date(ms);
    const pad = (n) => (n < 10 ? `0${n}` : String(n));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function sumarDiasYmd(ymd, dias) {
    const ms = utcMs(ymd);
    return ms == null ? ymd : ymdFromMs(ms + dias * 86400000);
}
/** 0 = lunes … 6 = domingo. */
function indiceDiaSemana(ymd) {
    const ms = utcMs(ymd);
    if (ms == null)
        return 0;
    const dow = new Date(ms).getUTCDay();
    return dow === 0 ? 6 : dow - 1;
}
function normalizarDiasSemana(mask) {
    const n = Math.round(Number(mask));
    if (!Number.isFinite(n) || n <= 0)
        return exports.DIAS_SEMANA_TODOS;
    return n & exports.DIAS_SEMANA_TODOS || exports.DIAS_SEMANA_TODOS;
}
function diaSemanaActivo(mask, indice) {
    return (normalizarDiasSemana(mask) & (1 << indice)) !== 0;
}
function alternarDiaSemana(mask, indice) {
    return normalizarDiasSemana(mask) ^ (1 << indice);
}
function gastoAplicaEnDia(g, ymd) {
    if (g.fecha_inicio && ymd < g.fecha_inicio)
        return false;
    if (g.fecha_fin && ymd > g.fecha_fin)
        return false;
    return diaSemanaActivo(g.dias_semana, indiceDiaSemana(ymd));
}
function diasQueAplican(g, ymds) {
    return ymds.filter((d) => gastoAplicaEnDia(g, d));
}
/** Días del mes calendario de `ymd` en que el gasto aplica (para repartir el mensual). */
function diasAplicablesEnMes(g, ymd) {
    const p = parseYmd(ymd);
    if (!p)
        return 0;
    const dim = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
    const pad = (n) => (n < 10 ? `0${n}` : String(n));
    let n = 0;
    for (let d = 1; d <= dim; d += 1) {
        if (gastoAplicaEnDia(g, `${p.y}-${pad(p.m)}-${pad(d)}`))
            n += 1;
    }
    return n;
}
/** «Todos los días», «Lunes a sábado», «Lun, Mié, Vie», «Todos menos domingo». */
function describirDiasSemana(mask) {
    const m = normalizarDiasSemana(mask);
    if (m === exports.DIAS_SEMANA_TODOS)
        return 'Todos los días';
    if (m === exports.DIAS_SEMANA_LUN_SAB)
        return 'Lunes a sábado';
    if (m === exports.DIAS_SEMANA_LUN_VIE)
        return 'Lunes a viernes';
    const activos = DIAS_SEMANA_ABREV.filter((_, i) => (m & (1 << i)) !== 0);
    const inactivos = exports.DIAS_SEMANA_NOMBRE.filter((_, i) => (m & (1 << i)) === 0);
    if (inactivos.length === 1)
        return `Todos menos ${inactivos[0]}`;
    return activos.join(', ');
}
function describirVigencia(g) {
    const partes = [describirDiasSemana(g.dias_semana)];
    if (g.fecha_inicio && g.fecha_fin) {
        partes.push(`del ${g.fecha_inicio} al ${g.fecha_fin}`);
    }
    else if (g.fecha_inicio) {
        partes.push(`desde ${g.fecha_inicio}`);
    }
    else if (g.fecha_fin) {
        partes.push(`hasta ${g.fecha_fin}`);
    }
    return partes.join(' · ');
}
/** Periodo inmediatamente anterior, del mismo tipo (o misma duración si es personalizado). */
function rangoPeriodoAnterior(periodo, fechaDesde, fechaHasta) {
    if (periodo === 'personalizado') {
        const a = utcMs(fechaDesde);
        const b = utcMs(fechaHasta);
        if (a == null || b == null)
            return null;
        const dias = Math.round((b - a) / 86400000) + 1;
        return (0, resumen_periodo_1.rangoPeriodoPersonalizado)(sumarDiasYmd(fechaDesde, -dias), sumarDiasYmd(fechaDesde, -1));
    }
    return (0, resumen_periodo_1.rangoPeriodoResumen)(periodo, sumarDiasYmd(fechaDesde, -1));
}
/** Diferencia porcentual frente al periodo anterior (null si el anterior fue 0). */
function variacionPct(actual, anterior) {
    if (!anterior)
        return null;
    return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}
