"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESA_BOUTIQUE_NUMERO = exports.MESA_MOSTRADOR_NUMERO = exports.MESA_PARA_LLEVAR_NUMERO = void 0;
exports.resolverMesasVirtuales = resolverMesasVirtuales;
exports.esMesaVirtualNumero = esMesaVirtualNumero;
exports.esMesaMostradorNumero = esMesaMostradorNumero;
exports.esMesaParaLlevarNumero = esMesaParaLlevarNumero;
exports.esMesaBoutiqueNumero = esMesaBoutiqueNumero;
exports.resolverCanalComanda = resolverCanalComanda;
exports.destinoRecibeCanalComanda = destinoRecibeCanalComanda;
exports.numerosMesasVirtuales = numerosMesasVirtuales;
exports.tituloLugarMesa = tituloLugarMesa;
exports.etiquetaMesaNumero = etiquetaMesaNumero;
exports.etiquetaMesaComanda = etiquetaMesaComanda;
exports.tituloMesaAdmin = tituloMesaAdmin;
/** Mesa virtual para pedidos para llevar (no mesas 1–15). */
exports.MESA_PARA_LLEVAR_NUMERO = 98;
/** Mesa virtual para ventas en mostrador. */
exports.MESA_MOSTRADOR_NUMERO = 99;
/** Mesa virtual para ventas de tienda / retail (solo admin). */
exports.MESA_BOUTIQUE_NUMERO = 97;
function pickNum(snake, camel, fallback) {
    return snake ?? camel ?? fallback ?? 0;
}
function pickStr(snake, camel, fallback) {
    return (snake ?? camel ?? fallback ?? '').trim();
}
/** Resuelve números y etiquetas con defaults 97/98/99. */
function resolverMesasVirtuales(cfg) {
    return {
        numero_mesa_para_llevar: pickNum(cfg?.numero_mesa_para_llevar, cfg?.numeroMesaParaLlevar, exports.MESA_PARA_LLEVAR_NUMERO),
        numero_mesa_mostrador: pickNum(cfg?.numero_mesa_mostrador, cfg?.numeroMesaMostrador, exports.MESA_MOSTRADOR_NUMERO),
        numero_mesa_boutique: pickNum(cfg?.numero_mesa_boutique, cfg?.numeroMesaBoutique, exports.MESA_BOUTIQUE_NUMERO),
        etiqueta_para_llevar: pickStr(cfg?.etiqueta_para_llevar, cfg?.etiquetaParaLlevar, 'Pedidos para llevar'),
        etiqueta_mostrador: pickStr(cfg?.etiqueta_mostrador, cfg?.etiquetaMostrador, 'Mostrador'),
        etiqueta_boutique: pickStr(cfg?.etiqueta_boutique, cfg?.etiquetaBoutique, 'Tienda'),
    };
}
function esMesaVirtualNumero(numero, cfg, numerosBoutiqueExtra) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar ||
        numero === r.numero_mesa_mostrador ||
        numero === r.numero_mesa_boutique) {
        return true;
    }
    return Boolean(numerosBoutiqueExtra?.includes(numero));
}
function esMesaMostradorNumero(numero, cfg) {
    return numero === resolverMesasVirtuales(cfg).numero_mesa_mostrador;
}
function esMesaParaLlevarNumero(numero, cfg) {
    return numero === resolverMesasVirtuales(cfg).numero_mesa_para_llevar;
}
function esMesaBoutiqueNumero(numero, cfg, numerosBoutiqueExtra) {
    if (numerosBoutiqueExtra?.includes(numero))
        return true;
    return numero === resolverMesasVirtuales(cfg).numero_mesa_boutique;
}
/**
 * Resuelve el canal de impresión de cocina.
 * Mostrador es mesa virtual con modo en_mesa; para llevar usa mesa virtual o modo_servicio.
 */
function resolverCanalComanda(opts, cfg) {
    if (opts.modo_servicio === 'para_llevar' ||
        esMesaParaLlevarNumero(opts.mesa_numero, cfg)) {
        return 'para_llevar';
    }
    if (esMesaMostradorNumero(opts.mesa_numero, cfg)) {
        return 'mostrador';
    }
    return 'mesa';
}
function destinoRecibeCanalComanda(canal, flags) {
    const mesa = flags?.comanda_mesa !== false;
    const mostrador = flags?.comanda_mostrador !== false;
    const paraLlevar = flags?.comanda_para_llevar !== false;
    if (canal === 'mesa')
        return mesa;
    if (canal === 'mostrador')
        return mostrador;
    return paraLlevar;
}
function numerosMesasVirtuales(cfg, numerosBoutiqueExtra) {
    const r = resolverMesasVirtuales(cfg);
    const base = [
        r.numero_mesa_para_llevar,
        r.numero_mesa_mostrador,
        r.numero_mesa_boutique,
    ];
    const extras = (numerosBoutiqueExtra ?? []).filter((n) => Number.isFinite(n) && n > 0);
    return [...new Set([...base, ...extras])];
}
function etiquetaDeBoutiqueExtra(numero, extras) {
    const hit = extras?.find((e) => e.numero === numero);
    if (!hit)
        return null;
    const t = hit.etiqueta?.trim();
    return t || 'Tienda';
}
/** Texto para UI (pantallas de mesero/cocina). */
function tituloLugarMesa(numero, cfg, boutiqueExtras) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar)
        return r.etiqueta_para_llevar;
    if (numero === r.numero_mesa_mostrador)
        return r.etiqueta_mostrador;
    if (numero === r.numero_mesa_boutique)
        return r.etiqueta_boutique;
    const extra = etiquetaDeBoutiqueExtra(numero, boutiqueExtras);
    if (extra)
        return extra;
    return `Mesa ${numero}`;
}
/** Etiqueta corta para la grilla de mesas. */
function etiquetaMesaNumero(numero, cfg, boutiqueExtras) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar)
        return r.etiqueta_para_llevar;
    if (numero === r.numero_mesa_mostrador)
        return r.etiqueta_mostrador;
    if (numero === r.numero_mesa_boutique)
        return r.etiqueta_boutique;
    const extra = etiquetaDeBoutiqueExtra(numero, boutiqueExtras);
    if (extra)
        return extra;
    return String(numero);
}
/** Etiqueta en ticket de comanda impreso (más breve). */
function etiquetaMesaComanda(numero, cfg, boutiqueExtras) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar) {
        return r.etiqueta_para_llevar.length > 14
            ? 'Para llevar'
            : r.etiqueta_para_llevar;
    }
    if (numero === r.numero_mesa_mostrador)
        return r.etiqueta_mostrador;
    if (numero === r.numero_mesa_boutique)
        return r.etiqueta_boutique;
    const extra = etiquetaDeBoutiqueExtra(numero, boutiqueExtras);
    if (extra)
        return extra;
    return `Mesa ${numero}`;
}
/** Título en admin de mesas (mesas virtuales con descripción entre paréntesis). */
function tituloMesaAdmin(numero, cfg, boutiqueExtras) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar) {
        return `Mesa ${r.numero_mesa_para_llevar} (${r.etiqueta_para_llevar})`;
    }
    if (numero === r.numero_mesa_mostrador) {
        return `Mesa ${r.numero_mesa_mostrador} (${r.etiqueta_mostrador})`;
    }
    if (numero === r.numero_mesa_boutique) {
        return `Mesa ${r.numero_mesa_boutique} (${r.etiqueta_boutique})`;
    }
    const extra = etiquetaDeBoutiqueExtra(numero, boutiqueExtras);
    if (extra)
        return `Mesa ${numero} (${extra})`;
    return `Mesa ${numero}`;
}
