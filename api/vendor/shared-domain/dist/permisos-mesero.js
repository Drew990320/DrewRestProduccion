"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISOS_MESERO_GRUPOS = exports.PERMISOS_MESERO_META = exports.PERMISOS_MESERO_DEFAULTS = exports.PERMISOS_MESERO_KEYS = void 0;
exports.permisosMeseroTodos = permisosMeseroTodos;
/** Claves de permisos configurables para el rol mesero. */
exports.PERMISOS_MESERO_KEYS = [
    'agregar_items',
    'editar_cantidades',
    'quitar_lineas',
    'enviar_cocina',
    'reimprimir_comanda',
    'cobrar',
    'precuenta',
    'reimprimir_factura',
    'cancelar_pedido',
    'transferir_mesa',
    'agrupar_mesas',
    'ayuda_companeros',
];
exports.PERMISOS_MESERO_DEFAULTS = {
    agregar_items: true,
    editar_cantidades: true,
    quitar_lineas: true,
    enviar_cocina: true,
    reimprimir_comanda: true,
    cobrar: true,
    precuenta: true,
    reimprimir_factura: true,
    cancelar_pedido: true,
    transferir_mesa: true,
    agrupar_mesas: true,
    ayuda_companeros: true,
};
exports.PERMISOS_MESERO_META = {
    agregar_items: {
        titulo: 'Agregar ítems',
        detalle: 'Menú, bebidas y personalizaciones',
    },
    editar_cantidades: {
        titulo: 'Editar cantidades',
        detalle: '+/− en líneas aún no enviadas a cocina (lo ya enviado no se reduce)',
    },
    quitar_lineas: {
        titulo: 'Quitar ítems (antes de cocina)',
        detalle: 'Borrar productos del pedido solo si aún no se enviaron a cocina. No anula el ticket completo.',
    },
    enviar_cocina: {
        titulo: 'Enviar a cocina',
        detalle: 'Pasar platos pendientes a cocina',
    },
    reimprimir_comanda: {
        titulo: 'Reimprimir comanda',
        detalle: 'Volver a imprimir la comanda de cocina',
    },
    cobrar: {
        titulo: 'Cobrar / facturar',
        detalle: 'Cobro estándar, mixto y reparto por personas',
    },
    precuenta: {
        titulo: 'Pre-cuenta',
        detalle: 'Imprimir pre-cuenta antes del cobro',
    },
    reimprimir_factura: {
        titulo: 'Reimprimir factura',
        detalle: 'Reimprimir un cobro ya registrado',
    },
    cancelar_pedido: {
        titulo: 'Cancelar pedido completo',
        detalle: 'Anula todo el ticket (sin cobros). Independiente de quitar ítems sueltos.',
    },
    transferir_mesa: {
        titulo: 'Transferir mesa',
        detalle: 'Mover el pedido a otra mesa (libre u ocupada como segunda cuenta)',
    },
    agrupar_mesas: {
        titulo: 'Agrupar mesas',
        detalle: 'Unir mesas libres al mismo pedido o separarlas antes de cocina',
    },
    ayuda_companeros: {
        titulo: 'Ayuda a compañeros',
        detalle: 'Ver pedidos ajenos, recoger platos y avisar falta',
    },
};
/** Agrupa toggles en Permisos para que no se confundan entre sí. */
exports.PERMISOS_MESERO_GRUPOS = [
    {
        titulo: 'Pedido y cocina',
        detalle: 'Agregar, ajustar o quitar antes de cocina, y enviar/reimprimir comanda.',
        keys: [
            'agregar_items',
            'editar_cantidades',
            'quitar_lineas',
            'enviar_cocina',
            'reimprimir_comanda',
        ],
    },
    {
        titulo: 'Cobro y anulación',
        detalle: 'Cobrar es aparte de cancelar. Cancelar anula el ticket entero; quitar ítems no.',
        keys: [
            'cobrar',
            'precuenta',
            'reimprimir_factura',
            'cancelar_pedido',
        ],
    },
    {
        titulo: 'Mesas y equipo',
        detalle: 'Mover o agrupar mesas y ayudar a otros meseros.',
        keys: ['transferir_mesa', 'agrupar_mesas', 'ayuda_companeros'],
    },
];
function permisosMeseroTodos() {
    return {
        ...exports.PERMISOS_MESERO_DEFAULTS,
        puede_cerrar_anulando: true,
        es_admin: true,
    };
}
