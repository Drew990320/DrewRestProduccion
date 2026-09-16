"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarNombreTienda = validarNombreTienda;
exports.numerosMesaBoutiqueDeTiendas = numerosMesaBoutiqueDeTiendas;
const NOMBRE_MAX = 120;
/** Valida nombre de tienda para crear/editar. */
function validarNombreTienda(nombre) {
    const t = (nombre ?? '').trim();
    if (!t)
        return { ok: false, mensaje: 'El nombre de la tienda es obligatorio' };
    if (t.length > NOMBRE_MAX) {
        return {
            ok: false,
            mensaje: `El nombre no puede superar ${NOMBRE_MAX} caracteres`,
        };
    }
    return { ok: true, nombre: t };
}
/** Números de mesa boutique de una lista de tiendas (para etiquetas / reservas). */
function numerosMesaBoutiqueDeTiendas(tiendas, soloActivas = true) {
    if (!tiendas?.length)
        return [];
    return tiendas
        .filter((t) => (soloActivas ? t.activo !== false : true))
        .map((t) => t.numero_mesa_boutique)
        .filter((n) => Number.isFinite(n) && n > 0);
}
