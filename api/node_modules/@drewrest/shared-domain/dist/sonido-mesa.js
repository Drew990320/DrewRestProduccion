"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SONIDO_MESA_CATALOGO = exports.SONIDO_MESA_DEFECTO = exports.SONIDO_MESA_IDS = void 0;
exports.esSonidoMesaValido = esSonidoMesaValido;
exports.resolverSonidoMesa = resolverSonidoMesa;
exports.SONIDO_MESA_IDS = [
    'campana',
    'timbre',
    'madera',
    'cristal',
    'aviso',
    'cocina',
    'suave',
    'doble',
    'ascenso',
    'eco',
];
exports.SONIDO_MESA_DEFECTO = 'campana';
function esSonidoMesaValido(id) {
    return exports.SONIDO_MESA_IDS.includes(id ?? '');
}
function resolverSonidoMesa(id) {
    return esSonidoMesaValido(id) ? id : exports.SONIDO_MESA_DEFECTO;
}
exports.SONIDO_MESA_CATALOGO = {
    campana: {
        nombre: 'Campana',
        detalle: 'Dos notas claras',
        notas: [
            { hz: 523.25, inicio: 0, duracion: 0.16, ganancia: 0.55 },
            { hz: 783.99, inicio: 0.09, duracion: 0.28, ganancia: 0.7 },
        ],
    },
    timbre: {
        nombre: 'Timbre',
        detalle: 'Un golpe brillante',
        notas: [{ hz: 1174.66, inicio: 0, duracion: 0.2, ganancia: 0.8 }],
    },
    madera: {
        nombre: 'Madera',
        detalle: 'Dos toques graves',
        notas: [
            { hz: 174.61, inicio: 0, duracion: 0.08, ganancia: 0.9 },
            { hz: 146.83, inicio: 0.12, duracion: 0.1, ganancia: 0.85 },
        ],
    },
    cristal: {
        nombre: 'Cristal',
        detalle: 'Un ping alto',
        notas: [{ hz: 1567.98, inicio: 0, duracion: 0.32, ganancia: 0.55 }],
    },
    aviso: {
        nombre: 'Aviso',
        detalle: 'Tres notas que suben',
        notas: [
            { hz: 659.25, inicio: 0, duracion: 0.1, ganancia: 0.6 },
            { hz: 783.99, inicio: 0.09, duracion: 0.1, ganancia: 0.65 },
            { hz: 987.77, inicio: 0.18, duracion: 0.16, ganancia: 0.7 },
        ],
    },
    cocina: {
        nombre: 'Cocina',
        detalle: 'Dos notas medias',
        notas: [
            { hz: 440, inicio: 0, duracion: 0.18, ganancia: 0.65 },
            { hz: 554.37, inicio: 0.16, duracion: 0.22, ganancia: 0.7 },
        ],
    },
    suave: {
        nombre: 'Suave',
        detalle: 'Una nota baja y corta',
        notas: [{ hz: 349.23, inicio: 0, duracion: 0.28, ganancia: 0.5 }],
    },
    doble: {
        nombre: 'Doble',
        detalle: 'Dos pitidos iguales',
        notas: [
            { hz: 880, inicio: 0, duracion: 0.08, ganancia: 0.7 },
            { hz: 880, inicio: 0.14, duracion: 0.1, ganancia: 0.7 },
        ],
    },
    ascenso: {
        nombre: 'Ascenso',
        detalle: 'Sube de grave a agudo',
        notas: [
            { hz: 392, inicio: 0, duracion: 0.1, ganancia: 0.6 },
            { hz: 523.25, inicio: 0.1, duracion: 0.1, ganancia: 0.65 },
            { hz: 659.25, inicio: 0.2, duracion: 0.16, ganancia: 0.7 },
        ],
    },
    eco: {
        nombre: 'Eco',
        detalle: 'La nota se repite más baja',
        notas: [
            { hz: 698.46, inicio: 0, duracion: 0.16, ganancia: 0.75 },
            { hz: 698.46, inicio: 0.18, duracion: 0.22, ganancia: 0.35 },
        ],
    },
};
