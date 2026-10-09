"use strict";
/**
 * Sistema de unidades y conversiones genérico (masa, volumen, conteo, empaque).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarUnidad = normalizarUnidad;
exports.definicionUnidad = definicionUnidad;
exports.mismaDimension = mismaDimension;
exports.convertirCantidad = convertirCantidad;
exports.redondearInventario = redondearInventario;
exports.esUnidadBaseValida = esUnidadBaseValida;
exports.esUnidadEmpaque = esUnidadEmpaque;
exports.unidadCanonica = unidadCanonica;
exports.conversionesDePresentaciones = conversionesDePresentaciones;
exports.unidadesCompatibles = unidadesCompatibles;
exports.desglosePresentacion = desglosePresentacion;
const UNIDADES = {
    mg: { codigo: 'mg', dimension: 'masa', factor_base: 0.001 },
    g: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    gr: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    gramo: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    gramos: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    kg: { codigo: 'kg', dimension: 'masa', factor_base: 1000 },
    kilo: { codigo: 'kg', dimension: 'masa', factor_base: 1000 },
    kilogramo: { codigo: 'kg', dimension: 'masa', factor_base: 1000 },
    ml: { codigo: 'ml', dimension: 'volumen', factor_base: 1 },
    mililitro: { codigo: 'ml', dimension: 'volumen', factor_base: 1 },
    mililitros: { codigo: 'ml', dimension: 'volumen', factor_base: 1 },
    l: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    lt: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    litro: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    litros: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    u: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    un: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    unidad: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    unidades: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    porcion: { codigo: 'porcion', dimension: 'conteo', factor_base: 1 },
    porciones: { codigo: 'porcion', dimension: 'conteo', factor_base: 1 },
    paquete: { codigo: 'paquete', dimension: 'empaque', factor_base: 1 },
    paquetes: { codigo: 'paquete', dimension: 'empaque', factor_base: 1 },
    caja: { codigo: 'caja', dimension: 'empaque', factor_base: 1 },
    cajas: { codigo: 'caja', dimension: 'empaque', factor_base: 1 },
    bolsa: { codigo: 'bolsa', dimension: 'empaque', factor_base: 1 },
    bolsas: { codigo: 'bolsa', dimension: 'empaque', factor_base: 1 },
    bulto: { codigo: 'bulto', dimension: 'empaque', factor_base: 1 },
    bultos: { codigo: 'bulto', dimension: 'empaque', factor_base: 1 },
};
function normalizarUnidad(unidad) {
    return unidad.trim().toLowerCase().replace(/\s+/g, '');
}
function definicionUnidad(unidad) {
    const key = normalizarUnidad(unidad);
    return UNIDADES[key] ?? null;
}
function mismaDimension(unidadA, unidadB) {
    const a = definicionUnidad(unidadA);
    const b = definicionUnidad(unidadB);
    if (!a || !b)
        return false;
    return a.dimension === b.dimension;
}
function buscarConversionDirecta(desde, hacia, conversiones) {
    const d = normalizarUnidad(desde);
    const h = normalizarUnidad(hacia);
    for (const c of conversiones) {
        const o = normalizarUnidad(c.unidad_origen);
        const dest = normalizarUnidad(c.unidad_destino);
        if (o === d && dest === h && c.factor > 0)
            return c.factor;
        if (o === h && dest === d && c.factor > 0)
            return 1 / c.factor;
    }
    return null;
}
/**
 * Convierte cantidad entre unidades.
 * 1) Catálogo estándar (g↔kg, ml↔l).
 * 2) Tabla de conversiones del negocio (ej. 1 bulto = 25 kg).
 */
function convertirCantidad(cantidad, desde, hacia, conversiones = []) {
    if (!Number.isFinite(cantidad)) {
        return {
            ok: false,
            error: {
                codigo: 'sin_conversion',
                mensaje: 'Cantidad inválida',
            },
        };
    }
    const dNorm = normalizarUnidad(desde);
    const hNorm = normalizarUnidad(hacia);
    if (dNorm === hNorm) {
        return { ok: true, cantidad, unidad: hacia };
    }
    const custom = buscarConversionDirecta(desde, hacia, conversiones);
    if (custom != null) {
        return { ok: true, cantidad: cantidad * custom, unidad: hacia };
    }
    const defDesde = definicionUnidad(desde);
    const defHacia = definicionUnidad(hacia);
    if (defDesde && defHacia) {
        if (defDesde.dimension !== defHacia.dimension) {
            return {
                ok: false,
                error: {
                    codigo: 'dimension_incompatible',
                    mensaje: `No se puede convertir ${desde} (${defDesde.dimension}) a ${hacia} (${defHacia.dimension}) sin regla explícita`,
                },
            };
        }
        const enBase = cantidad * defDesde.factor_base;
        const resultado = enBase / defHacia.factor_base;
        return { ok: true, cantidad: resultado, unidad: hacia };
    }
    return {
        ok: false,
        error: {
            codigo: defDesde || defHacia ? 'sin_conversion' : 'unidad_desconocida',
            mensaje: `Sin conversión de ${desde} a ${hacia}`,
        },
    };
}
/** Redondeo estable para inventario (3 decimales). */
function redondearInventario(n) {
    return Math.round(n * 1000) / 1000;
}
/**
 * Unidad en la que se guarda el stock y descuentan las recetas: una medida real
 * (masa, volumen o conteo). Los empaques van como presentaciones del artículo.
 */
function esUnidadBaseValida(unidad) {
    const def = definicionUnidad(unidad);
    return def != null && def.dimension !== 'empaque';
}
function esUnidadEmpaque(unidad) {
    return definicionUnidad(unidad)?.dimension === 'empaque';
}
/** Forma canónica de una unidad conocida (gramos → g); si no se conoce, la deja limpia. */
function unidadCanonica(unidad) {
    return definicionUnidad(unidad)?.codigo ?? unidad.trim();
}
/** Las presentaciones de un artículo como reglas de conversión hacia su unidad base. */
function conversionesDePresentaciones(unidadBase, presentaciones) {
    return presentaciones
        .filter((p) => p.factor > 0 && p.nombre.trim())
        .map((p) => ({
        unidad_origen: p.nombre,
        unidad_destino: unidadBase,
        factor: p.factor,
    }));
}
/**
 * Unidades que puede usar una receta o una entrada para este artículo:
 * la base, las de su misma dimensión (g ↔ kg) y sus presentaciones.
 */
function unidadesCompatibles(unidadBase, presentaciones = []) {
    const out = [unidadCanonica(unidadBase)];
    const def = definicionUnidad(unidadBase);
    if (def && def.dimension !== 'empaque') {
        const vistos = new Set(out);
        for (const u of Object.values(UNIDADES)) {
            if (u.dimension === def.dimension && !vistos.has(u.codigo)) {
                vistos.add(u.codigo);
                out.push(u.codigo);
            }
        }
    }
    for (const p of presentaciones) {
        if (p.factor > 0 && p.nombre.trim() && !out.includes(p.nombre.trim())) {
            out.push(p.nombre.trim());
        }
    }
    return out;
}
function pluralPresentacion(nombre, n) {
    const base = nombre.trim().toLowerCase();
    if (n === 1)
        return base;
    if (/[aeiouáéó]$/.test(base))
        return `${base}s`;
    if (/[^s]$/.test(base))
        return `${base}es`;
    return base;
}
/**
 * Stock expresado en la presentación más grande que cabe:
 * 34 u con «Paquete» = 10 → «3 paquetes + 4 u». Null si no aplica.
 */
function desglosePresentacion(stock, unidadBase, presentaciones) {
    if (!(stock > 0))
        return null;
    const candidatas = presentaciones
        .filter((p) => p.factor > 1 && stock >= p.factor)
        .sort((a, b) => b.factor - a.factor);
    const p = candidatas[0];
    if (!p)
        return null;
    const enteras = Math.floor(redondearInventario(stock / p.factor));
    const resto = redondearInventario(stock - enteras * p.factor);
    const texto = `${enteras} ${pluralPresentacion(p.nombre, enteras)}`;
    if (resto <= 0)
        return texto;
    return `${texto} + ${resto.toLocaleString('es-CO', { maximumFractionDigits: 3 })} ${unidadCanonica(unidadBase)}`;
}
