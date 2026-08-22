"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AYUDA_ASIGNAR_MESA_AUTOSERVICIO = exports.AYUDA_TRANSFERENCIA_PEDIDO = void 0;
exports.pedidoDebeTenerLineaMazorca = pedidoDebeTenerLineaMazorca;
exports.validarTransferenciaPedido = validarTransferenciaPedido;
const mesa_label_1 = require("./mesa-label");
const mazorca_pedido_1 = require("./mazorca-pedido");
const cocina_producto_1 = require("./cocina-producto");
const mazorca_pedido_2 = require("./mazorca-pedido");
function esRaiz(d) {
    const padre = d.id_detalle_padre ?? d.idDetallePadre;
    return padre == null;
}
function esMazorca(d) {
    return (0, mazorca_pedido_2.esDetalleMazorcaAcompanamiento)(d);
}
function pedidoDebeTenerLineaMazorca(mesaNumero, detalles, mazorcaActiva = true) {
    if (!(0, mazorca_pedido_1.pedidoUsaLineaMazorca)(mesaNumero, mazorcaActiva))
        return false;
    return detalles.some((d) => {
        if (!esRaiz(d))
            return false;
        if (esMazorca(d) || (d.es_empacable ?? d.esEmpacable))
            return false;
        if (d.es_bebida != null)
            return !d.es_bebida;
        return (0, cocina_producto_1.debeMarcarCocina)(d.categoria_nombre ?? '', false);
    });
}
const MSG_DESTINO_VIRTUAL = 'No se puede transferir a Para llevar, Mostrador ni Tienda. Cancela este pedido y abre uno nuevo allí.';
const MSG_ORIGEN_TIENDA = 'Las ventas de tienda no se pasan a una mesa. Cobra o cancela ese ticket.';
const MSG_DESTINO_ANEXA = 'Esa mesa está agrupada a otro pedido. Desagrúpala antes de transferir aquí, o elige otra mesa.';
const NOTA_EMPAQUE = ' El empaque para llevar se queda en la cuenta; el administrador puede quitarlo con −.';
/**
 * Transferencia a mesa física (no 97/98/99).
 * Origen para llevar o mostrador: se sienta en mesa (el empaque no se quita solo).
 * Autoservicio en esas colas: igual, asignar mesa.
 * - Libre: mueve la cuenta.
 * - Ocupada: segunda cuenta, sin agrupar mesas.
 */
function validarTransferenciaPedido(input) {
    const { origen_mesa_numero: origen, destino_mesa_numero: destino, destino_libre: libre, destino_es_anexa: esAnexa = false, mesas_virtuales: mesasVirtuales, origen_autoservicio: origenAutoservicio = false, } = input;
    if ((0, mesa_label_1.esMesaBoutiqueNumero)(origen, mesasVirtuales)) {
        return { accion: 'rechazar', mensaje: MSG_ORIGEN_TIENDA };
    }
    if ((0, mesa_label_1.esMesaVirtualNumero)(destino, mesasVirtuales)) {
        return { accion: 'rechazar', mensaje: MSG_DESTINO_VIRTUAL };
    }
    if (esAnexa) {
        return { accion: 'rechazar', mensaje: MSG_DESTINO_ANEXA };
    }
    const lugar = (0, mesa_label_1.tituloLugarMesa)(destino, mesasVirtuales);
    const origenVirtual = (0, mesa_label_1.esMesaVirtualNumero)(origen, mesasVirtuales);
    if (origenVirtual && origenAutoservicio) {
        if (libre) {
            return {
                accion: 'mover',
                mensaje_confirmacion: `¿Asignar el autoservicio a ${lugar}? Dejará de estar sin mesa física.${NOTA_EMPAQUE}`,
            };
        }
        return {
            accion: 'mover',
            mensaje_confirmacion: `¿Asignar el autoservicio a ${lugar}? Quedará como cuenta separada junto al pedido que ya hay ahí, sin agrupar mesas.${NOTA_EMPAQUE}`,
        };
    }
    if (origenVirtual) {
        if (libre) {
            return {
                accion: 'mover',
                mensaje_confirmacion: `¿Pasar este pedido a ${lugar}? Dejará la cola de para llevar o mostrador.${NOTA_EMPAQUE}`,
            };
        }
        return {
            accion: 'mover',
            mensaje_confirmacion: `¿Pasar este pedido a ${lugar}? Quedará como cuenta separada junto al pedido que ya hay ahí, sin agrupar mesas.${NOTA_EMPAQUE}`,
        };
    }
    if (libre) {
        return {
            accion: 'mover',
            mensaje_confirmacion: `¿Mover el pedido a ${lugar}? La mesa actual quedará libre si no hay más pedidos abiertos.`,
        };
    }
    return {
        accion: 'mover',
        mensaje_confirmacion: `¿Mover el pedido a ${lugar}? Quedará como cuenta separada junto al pedido que ya hay ahí (como en bebidas), sin agrupar mesas. La mesa actual quedará libre.`,
    };
}
exports.AYUDA_TRANSFERENCIA_PEDIDO = 'Elige mesa libre u ocupada. En ocupada queda como segunda cuenta (sin agrupar). Desde para llevar o mostrador también puedes sentar el pedido; el empaque no se quita solo (el administrador lo baja con −).';
exports.AYUDA_ASIGNAR_MESA_AUTOSERVICIO = 'Elige una mesa física libre u ocupada para asignar este autoservicio. En ocupada queda como cuenta separada (sin agrupar).';
