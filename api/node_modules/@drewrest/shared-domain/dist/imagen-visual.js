"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MENU_IMAGEN_AJUSTE_DESCRIPCION = exports.MENU_IMAGEN_AJUSTE_LABELS = exports.MENU_IMAGEN_AJUSTE_IDS = exports.MENU_IMAGEN_ALTURA_DESCRIPCION = exports.MENU_IMAGEN_ALTURA_LABELS = exports.MENU_IMAGEN_ALTURA_IDS = exports.LOGO_TICKET_TAMANO_DESCRIPCION = exports.LOGO_TICKET_TAMANO_LABELS = exports.LOGO_TICKET_TAMANO_IDS = void 0;
exports.esLogoTicketTamanoValido = esLogoTicketTamanoValido;
exports.resolverLogoTicketTamano = resolverLogoTicketTamano;
exports.logoTicketMaxAltoPx = logoTicketMaxAltoPx;
exports.esMenuImagenAlturaValida = esMenuImagenAlturaValida;
exports.resolverMenuImagenAltura = resolverMenuImagenAltura;
exports.menuImagenAlturaPx = menuImagenAlturaPx;
exports.esMenuImagenAjusteValido = esMenuImagenAjusteValido;
exports.resolverMenuImagenAjuste = resolverMenuImagenAjuste;
/** Tamaño del logo en factura / ticket (alto máximo; siempre contain). */
exports.LOGO_TICKET_TAMANO_IDS = ['chico', 'medio', 'grande'];
exports.LOGO_TICKET_TAMANO_LABELS = {
    chico: 'Chico',
    medio: 'Medio',
    grande: 'Grande',
};
exports.LOGO_TICKET_TAMANO_DESCRIPCION = {
    chico: 'Logo compacto en el encabezado del ticket.',
    medio: 'Tamaño equilibrado (predeterminado).',
    grande: 'Logo más visible; ocupa más papel.',
};
const LOGO_TICKET_MAX_ALTO_PX = {
    chico: 120,
    medio: 220,
    grande: 320,
};
function esLogoTicketTamanoValido(id) {
    return (typeof id === 'string' &&
        exports.LOGO_TICKET_TAMANO_IDS.includes(id));
}
function resolverLogoTicketTamano(guardado) {
    return esLogoTicketTamanoValido(guardado) ? guardado : 'medio';
}
function logoTicketMaxAltoPx(id) {
    return LOGO_TICKET_MAX_ALTO_PX[resolverLogoTicketTamano(id)];
}
/** Alto del marco de foto en tarjetas del menú. */
exports.MENU_IMAGEN_ALTURA_IDS = ['compacta', 'normal', 'grande'];
exports.MENU_IMAGEN_ALTURA_LABELS = {
    compacta: 'Compacta',
    normal: 'Normal',
    grande: 'Grande',
};
exports.MENU_IMAGEN_ALTURA_DESCRIPCION = {
    compacta: 'Menos alto; más platos visibles a la vez.',
    normal: 'Altura equilibrada (predeterminado).',
    grande: 'Foto más grande y fácil de reconocer.',
};
const MENU_IMAGEN_ALTURA_PX = {
    compacta: 72,
    normal: 96,
    grande: 128,
};
function esMenuImagenAlturaValida(id) {
    return (typeof id === 'string' &&
        exports.MENU_IMAGEN_ALTURA_IDS.includes(id));
}
function resolverMenuImagenAltura(guardado) {
    return esMenuImagenAlturaValida(guardado) ? guardado : 'normal';
}
function menuImagenAlturaPx(id) {
    return MENU_IMAGEN_ALTURA_PX[resolverMenuImagenAltura(id)];
}
/** Cómo encaja la foto en el marco. */
exports.MENU_IMAGEN_AJUSTE_IDS = ['contain', 'cover'];
exports.MENU_IMAGEN_AJUSTE_LABELS = {
    contain: 'Completa',
    cover: 'Llenar',
};
exports.MENU_IMAGEN_AJUSTE_DESCRIPCION = {
    contain: 'Se ve toda la foto; puede dejar bandas vacías.',
    cover: 'Llena el marco; puede recortar bordes.',
};
function esMenuImagenAjusteValido(id) {
    return (typeof id === 'string' &&
        exports.MENU_IMAGEN_AJUSTE_IDS.includes(id));
}
function resolverMenuImagenAjuste(guardado) {
    return esMenuImagenAjusteValido(guardado) ? guardado : 'contain';
}
