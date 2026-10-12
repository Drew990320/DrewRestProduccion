"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESCUENTO_MANUAL_ID = exports.MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT = exports.SOPAS_MIN_UNIDADES_DEFAULT = exports.UMBRAL_SUBTOTAL_OTROS_COP = void 0;
exports.esLineaSopa = esLineaSopa;
exports.resolverConfigPromociones = resolverConfigPromociones;
exports.calcularDescuentosPedido = calcularDescuentosPedido;
exports.aplicableDescuentoManual = aplicableDescuentoManual;
exports.etiquetaDescuentoManual = etiquetaDescuentoManual;
exports.montoDescuentoManualDesglose = montoDescuentoManualDesglose;
exports.resolverMontoDescuentoManual = resolverMontoDescuentoManual;
/** Subtotal mínimo de ítems que no son sopa para activar el descuento de sopas. */
exports.UMBRAL_SUBTOTAL_OTROS_COP = 50000;
/** Mínimo de unidades de sopa para activar el descuento global de sopas. */
exports.SOPAS_MIN_UNIDADES_DEFAULT = 2;
/** Mínimo de platos principales para el descuento de clientes camioneros. */
exports.MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT = 1;
const promociones_pedido_1 = require("./promociones-pedido");
function etiquetasEfectivas(ctx) {
    const set = new Set(ctx.etiquetas_promocion ?? []);
    if (ctx.cliente_mulero) {
        set.add(promociones_pedido_1.ETIQUETA_LEGACY_MULERO);
    }
    return [...set];
}
function reglasEfectivas(config) {
    const migrado = (0, promociones_pedido_1.migrarLegacyConfigPromociones)(config);
    const parsed = config.reglas_promocion;
    if (Array.isArray(parsed) && parsed.length > 0) {
        const fromConfig = parsed;
        const ids = new Set(fromConfig.map((r) => r.id));
        for (const r of migrado.reglas) {
            if (!ids.has(r.id))
                fromConfig.push(r);
        }
        return fromConfig;
    }
    return migrado.reglas;
}
/** @deprecated Usar flag de categoría o `lineaMarcadaPromo` en promociones-pedido. */
function esLineaSopa(linea) {
    if (linea.participa_descuento_sopas != null) {
        return linea.participa_descuento_sopas;
    }
    const cat = (linea.categoria_nombre ?? '').toLowerCase();
    const nom = (linea.nombre_producto ?? '').toLowerCase();
    return cat.includes('sopa') || nom.includes('sopa');
}
function resolverConfigPromociones(config) {
    const migrado = (0, promociones_pedido_1.migrarLegacyConfigPromociones)(config);
    const reglas = Array.isArray(config.reglas_promocion) && config.reglas_promocion.length > 0
        ? (() => {
            const fromConfig = config.reglas_promocion;
            const ids = new Set(fromConfig.map((r) => r.id));
            for (const r of migrado.reglas) {
                if (!ids.has(r.id))
                    fromConfig.push(r);
            }
            return fromConfig;
        })()
        : migrado.reglas;
    const etiquetas = Array.isArray(config.etiquetas_pedido) && config.etiquetas_pedido.length > 0
        ? config.etiquetas_pedido
        : migrado.etiquetas_pedido;
    return { reglas_promocion: reglas, etiquetas_pedido: etiquetas };
}
function calcularDescuentosPedido(lineas, config, ctx = {}) {
    const contexto = typeof ctx === 'boolean' ? { cliente_mulero: ctx } : ctx;
    const reglas = reglasEfectivas(config);
    const promo = (0, promociones_pedido_1.calcularDescuentoPromociones)(lineas, reglas, etiquetasEfectivas(contexto));
    const subtotal = lineas.reduce((s, l) => s + (Number(l.subtotal_linea) || 0), 0);
    const manual = aplicableDescuentoManual(contexto.descuento_manual?.monto ?? 0, subtotal - promo.total);
    if (manual <= 0) {
        return {
            descuento_sopas: 0,
            descuento_muleros: 0,
            descuento_promociones: promo.total,
            promociones_desglose: promo.desglose,
        };
    }
    return {
        descuento_sopas: 0,
        descuento_muleros: 0,
        descuento_promociones: promo.total + manual,
        promociones_desglose: [
            ...promo.desglose,
            {
                id: exports.DESCUENTO_MANUAL_ID,
                etiqueta: etiquetaDescuentoManual(contexto.descuento_manual?.motivo),
                monto: manual,
            },
        ],
    };
}
exports.DESCUENTO_MANUAL_ID = 'descuento_manual';
/** Parte del descuento manual que cabe en la base (subtotal − otros descuentos). */
function aplicableDescuentoManual(monto, base) {
    const m = Math.round(Number(monto) || 0);
    const b = Math.round(Number(base) || 0);
    if (m <= 0 || b <= 0)
        return 0;
    return Math.min(m, b);
}
function etiquetaDescuentoManual(motivo) {
    const m = motivo?.trim();
    return m ? `manual · ${m}` : 'manual';
}
/** Monto del descuento manual incluido en un desglose de promociones. */
function montoDescuentoManualDesglose(desglose) {
    return (desglose ?? [])
        .filter((d) => d.id === exports.DESCUENTO_MANUAL_ID)
        .reduce((s, d) => s + d.monto, 0);
}
/**
 * Convierte la entrada del admin (% / monto / nuevo total) en el monto a descontar.
 * `totalCon(m)` debe devolver el total a cobrar aplicando un descuento manual `m`
 * (incluye impoconsumo), para resolver el modo «nuevo total».
 */
function resolverMontoDescuentoManual(modo, valor, base, totalCon) {
    const v = Number(valor) || 0;
    const b = Math.max(0, Math.round(base));
    if (modo === 'porcentaje') {
        return Math.round((b * Math.min(Math.max(v, 0), 100)) / 100);
    }
    if (modo === 'monto')
        return Math.min(Math.max(Math.round(v), 0), b);
    const objetivo = Math.max(0, Math.round(v));
    let m = 0;
    for (let i = 0; i < 8; i++) {
        const diff = totalCon(m) - objetivo;
        if (Math.abs(diff) < 1)
            break;
        m = Math.min(Math.max(Math.round(m + diff), 0), b);
    }
    return m;
}
