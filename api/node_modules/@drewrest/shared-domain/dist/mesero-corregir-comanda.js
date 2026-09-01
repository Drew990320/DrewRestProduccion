"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meseroPuedeModificarLineaEnCocina = meseroPuedeModificarLineaEnCocina;
/** Mesero puede quitar/reducir una línea ya enviada a cocina (según config del restaurante). */
function meseroPuedeModificarLineaEnCocina(enviadoCocina, esAdmin, meseroCorregirComandaEnCocina) {
    if (!enviadoCocina)
        return true;
    return esAdmin || Boolean(meseroCorregirComandaEnCocina);
}
