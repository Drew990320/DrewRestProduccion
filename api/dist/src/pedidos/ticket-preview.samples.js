"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICKET_PREVIEW_CATALOG = void 0;
exports.catalogItemForTipo = catalogItemForTipo;
exports.buildSampleEscPosBuffer = buildSampleEscPosBuffer;
exports.buildConfigPreviewEscPos = buildConfigPreviewEscPos;
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const cierre_caja_escpos_builder_1 = require("./cierre-caja-escpos.builder");
const domicilio_escpos_builder_1 = require("./domicilio-escpos.builder");
const cuentas_divididas_escpos_builder_1 = require("./cuentas-divididas-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
exports.TICKET_PREVIEW_CATALOG = [
    {
        id: 'comanda',
        label: 'Comanda de cocina',
        grupo: 'Cocina',
        descripcion: 'Platos sin precios para la cocina.',
    },
    {
        id: 'comanda_adicional',
        label: 'Comanda adicional',
        grupo: 'Cocina',
        descripcion: 'Solo platos nuevos de un segundo envío.',
    },
    {
        id: 'comanda_reimpresion',
        label: 'Reimpresión de comanda',
        grupo: 'Cocina',
        descripcion: 'Marca REIMPRESIÓN en el ticket.',
    },
    {
        id: 'comanda_estacion',
        label: 'Comanda por estación',
        grupo: 'Cocina',
        descripcion: 'Solo los platos de una estación (bar, parrilla…).',
    },
    {
        id: 'domicilio',
        label: 'Datos de domicilio',
        grupo: 'Cocina',
        descripcion: 'Cliente, teléfono y dirección para el domiciliario.',
    },
    {
        id: 'domicilio_blanco',
        label: 'Domicilio en blanco',
        grupo: 'Cocina',
        descripcion: 'Líneas vacías para llenar a mano.',
    },
    {
        id: 'precuenta',
        label: 'Pre-cuenta',
        grupo: 'Cobro',
        descripcion: 'Vista previa antes del cobro; no registra pago.',
    },
    {
        id: 'autoservicio_caja',
        label: 'Autoservicio en caja',
        grupo: 'Cobro',
        descripcion: 'Turno que el cliente envía desde el kiosko.',
    },
    {
        id: 'factura_efectivo',
        label: 'Factura (efectivo)',
        grupo: 'Cobro',
        descripcion: 'Ticket de cobro con ítems, descuentos y total.',
    },
    {
        id: 'venta_tienda',
        label: 'Venta de tienda',
        grupo: 'Cobro',
        descripcion: 'Logos del restaurante y la tienda, con vendedor.',
    },
    {
        id: 'factura_negocio',
        label: 'Copia negocio',
        grupo: 'Cobro',
        descripcion: 'Segunda copia para archivo del restaurante.',
    },
    {
        id: 'factura_cliente',
        label: 'Copia cliente',
        grupo: 'Cobro',
        descripcion: 'Copia entregada al comensal.',
    },
    {
        id: 'factura_reimpresion',
        label: 'Reimpresión de factura',
        grupo: 'Cobro',
        descripcion: 'Ticket marcado como reimpresión.',
    },
    {
        id: 'factura_parcial',
        label: 'Cobro parcial',
        grupo: 'Cobro',
        descripcion: 'Parte de la cuenta en una tanda.',
    },
    {
        id: 'factura_mixto',
        label: 'Pago mixto',
        grupo: 'Cobro',
        descripcion: 'Efectivo + transferencia en un cobro.',
    },
    {
        id: 'factura_total_pedido',
        label: 'Total del pedido',
        grupo: 'Cobro',
        descripcion: 'Resumen con todos los cobros del pedido.',
    },
    {
        id: 'factura_fiado',
        label: 'Cobro a crédito',
        grupo: 'Cobro',
        descripcion: 'Cliente queda debiendo; datos de crédito.',
    },
    {
        id: 'cuentas_divididas',
        label: 'Cuentas divididas',
        grupo: 'Cobro',
        descripcion: 'Detalle de pedidos cobrados en varias facturas.',
    },
    {
        id: 'cierre_caja',
        label: 'Cierre de caja',
        grupo: 'Caja',
        descripcion: 'Totales del día y efectivo esperado.',
    },
    {
        id: 'base_caja',
        label: 'Base de caja (apertura)',
        grupo: 'Caja',
        descripcion: 'Comprobante al abrir el día.',
    },
    {
        id: 'arqueo_caja',
        label: 'Arqueo de caja',
        grupo: 'Caja',
        descripcion: 'Efectivo contado frente al esperado, con faltante o sobrante.',
    },
    {
        id: 'base_caja_cierre',
        label: 'Base final',
        grupo: 'Caja',
        descripcion: 'Efectivo que queda para mañana y retiro de caja.',
    },
    {
        id: 'movimiento_entrada',
        label: 'Entrada manual de caja',
        grupo: 'Caja',
        descripcion: 'Ingreso de efectivo con motivo.',
    },
    {
        id: 'movimiento_salida',
        label: 'Salida manual de caja',
        grupo: 'Caja',
        descripcion: 'Retiro de efectivo con motivo.',
    },
    {
        id: 'items_menu',
        label: 'Ventas por producto',
        grupo: 'Caja',
        descripcion: 'Cantidades y totales vendidos por plato en el día.',
    },
];
const DEMO_EMITIDA = '2026-07-09T18:30:00.000Z';
const lineasDemoFactura = [
    {
        cantidad: 2,
        nombre_producto: 'Bandeja paisa',
        subtotal_linea: 56000,
        personalizaciones: ['Sin chicharrón'],
        nota_cocina: null,
    },
    {
        cantidad: 1,
        nombre_producto: 'Limonada natural',
        subtotal_linea: 6000,
        personalizaciones: [],
        nota_cocina: null,
    },
    {
        cantidad: 1,
        nombre_producto: 'Empaque para llevar',
        subtotal_linea: 2000,
        personalizaciones: [],
        nota_cocina: null,
    },
];
function facturaBase(overrides = {}) {
    return {
        id_pedido: 1042,
        id_factura: 891,
        numero_factura: 'POS-000123',
        mesa_numero: 7,
        mesa_etiqueta: 'Mesa 7',
        num_comensales: 3,
        mesero: 'Ana López',
        modo_servicio: 'en_mesa',
        lineas: lineasDemoFactura,
        subtotal: 64000,
        descuento_sopas: 0,
        descuento_muleros: 4000,
        descuento_promociones: 0,
        total: 60000,
        metodo_pago: 'efectivo',
        emitida_en: DEMO_EMITIDA,
        ...overrides,
    };
}
function comandaBase(overrides = {}) {
    return {
        id_pedido: 1042,
        mesa_numero: 7,
        mesa_etiqueta: 'Mesa 7',
        num_comensales: 3,
        mesero: 'Ana López',
        modo_servicio: 'en_mesa',
        lineas: [
            {
                id_detalle: 1,
                cantidad: 2,
                nombre_producto: 'Bandeja paisa',
                nota_cocina: 'Sin chicharrón',
                personalizaciones: ['Arroz aparte'],
            },
            {
                id_detalle: 2,
                cantidad: 1,
                nombre_producto: 'Mazorca desgranada',
                nota_cocina: null,
                personalizaciones: ['Con queso costeño'],
            },
        ],
        emitida_en: DEMO_EMITIDA,
        ...overrides,
    };
}
const SAMPLE_BUILDERS = {
    comanda: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase(), w),
    comanda_adicional: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase({ es_adicional: true }), w),
    comanda_reimpresion: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase({ es_reimpresion: true }), w),
    comanda_estacion: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase({
        estacion: 'Bar',
        lineas: [
            {
                id_detalle: 3,
                cantidad: 2,
                nombre_producto: 'Limonada de coco',
                nota_cocina: 'Poco hielo',
                personalizaciones: [],
            },
            {
                id_detalle: 4,
                cantidad: 1,
                nombre_producto: 'Cerveza Club Colombia',
                nota_cocina: null,
                personalizaciones: [],
            },
        ],
    }), w),
    domicilio: (w) => (0, domicilio_escpos_builder_1.buildDomicilioEscPos)({
        id_pedido: 1043,
        mesa_etiqueta: 'Domicilio',
        mesero: 'Ana López',
        forzar_blanco: false,
        cliente_nombre: 'Carlos Ramírez',
        cliente_telefono: '300 123 4567',
        cliente_direccion: 'Cra 45 # 12-34, Apto 501, Barrio Laureles',
        emitida_en: DEMO_EMITIDA,
    }, w),
    domicilio_blanco: (w) => (0, domicilio_escpos_builder_1.buildDomicilioEscPos)({
        id_pedido: 1044,
        mesa_etiqueta: 'Domicilio',
        mesero: 'Ana López',
        forzar_blanco: true,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
        emitida_en: DEMO_EMITIDA,
    }, w),
    precuenta: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ es_precuenta: true, metodo_pago: undefined }), w),
    autoservicio_caja: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        es_precuenta: true,
        es_autoservicio_caja: true,
        metodo_pago: undefined,
        mesero: '',
    }), w),
    factura_efectivo: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase(), w),
    venta_tienda: (w, ctx) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        mesa_numero: 0,
        mesa_etiqueta: 'Venta tienda',
        mesero: 'Laura Gómez',
        num_comensales: 1,
        tienda: ctx.tienda ?? { nombre: 'Tienda', logo_archivo: null },
        lineas: [
            { cantidad: 1, nombre_producto: 'Camiseta bordada talla M', subtotal_linea: 45000, personalizaciones: [], nota_cocina: null },
            { cantidad: 2, nombre_producto: 'Café de origen 250 g', subtotal_linea: 36000, personalizaciones: [], nota_cocina: null },
            { cantidad: 1, nombre_producto: 'Llavero artesanal', subtotal_linea: 8000, personalizaciones: [], nota_cocina: null },
        ],
        subtotal: 89000,
        descuento_muleros: 0,
        total: 89000,
        detalle_exceso_cobro: {
            monto_recibido_efectivo: 100000,
            vuelto_cliente_efectivo: 11000,
            vuelto_cliente_transferencia: 0,
            pago_domiciliario: 0,
            pago_mesero: 0,
        },
    }), w),
    factura_negocio: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ copia_destinatario: 'negocio' }), w),
    factura_cliente: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ copia_destinatario: 'cliente' }), w),
    factura_reimpresion: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ es_reimpresion: true }), w),
    factura_parcial: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        es_cobro_parcial: true,
        lineas: lineasDemoFactura.slice(0, 2),
        subtotal: 62000,
        total: 58000,
    }), w),
    factura_mixto: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        metodo_pago: 'mixto',
        cobros_resumen: [
            { metodo_pago: 'efectivo', total: 35000 },
            { metodo_pago: 'transferencia', total: 25000 },
        ],
        detalle_exceso_cobro: {
            monto_recibido_efectivo: 40000,
            monto_transferencia_recibido: 25000,
            vuelto_cliente_efectivo: 5000,
            vuelto_cliente_transferencia: 0,
            pago_domiciliario: 0,
            pago_mesero: 0,
        },
    }), w),
    factura_total_pedido: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        es_total_pedido: true,
        cobros_resumen: [
            { metodo_pago: 'efectivo', total: 32000 },
            { metodo_pago: 'transferencia', total: 28000 },
        ],
    }), w),
    factura_fiado: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        metodo_pago: 'fiado',
        fiado_cliente: 'Carlos Méndez',
        fiado_telefono: '300 123 4567',
    }), w),
    cuentas_divididas: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            emitida_en: DEMO_EMITIDA,
            pedidos: [
                {
                    id_pedido: 1042,
                    mesa_numero: 7,
                    mesa_etiqueta: 'Mesa 7',
                    total_pedido: 120000,
                    facturas: [
                        {
                            tanda: 1,
                            id_factura: 891,
                            total: 60000,
                            metodo_pago: 'efectivo',
                            emitida_en: DEMO_EMITIDA,
                            es_parcial: true,
                        },
                        {
                            tanda: 2,
                            id_factura: 892,
                            total: 60000,
                            metodo_pago: 'transferencia',
                            emitida_en: DEMO_EMITIDA,
                            es_parcial: true,
                        },
                    ],
                },
            ],
        };
        return (0, cuentas_divididas_escpos_builder_1.buildCuentasDivididasEscPos)(ticket, w);
    },
    cierre_caja: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            total_facturado: 2450000,
            total_facturas: 87,
            monto_base_efectivo: 150000,
            totales_por_metodo: {
                efectivo: 980000,
                transferencia: 1320000,
                tarjeta: 180000,
                fiado: 150000,
            },
            transferido_recibido: 1370000,
            total_fiados_dia: 150000,
            efectivo_esperado_en_caja: 1130000,
            total_pagos_meseros: 45000,
            total_devoluciones_efectivo: 12000,
            total_entradas_manual: 20000,
            total_salidas_manual: 8000,
            monto_contado_efectivo: 1128000,
            monto_base_cierre_efectivo: 150000,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildCierreCajaEscPos)(ticket, w);
    },
    base_caja: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            monto_base_efectivo: 150000,
            registrado_por: 'Admin Demo',
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildBaseCajaEscPos)(ticket, w);
    },
    arqueo_caja: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            monto_contado_efectivo: 1128000,
            efectivo_esperado_en_caja: 1130000,
            registrado_por: 'Admin Demo',
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildArqueoCajaEscPos)(ticket, w);
    },
    base_caja_cierre: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            monto_base_cierre_efectivo: 150000,
            monto_contado_efectivo: 1128000,
            registrado_por: 'Admin Demo',
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildBaseCajaCierreEscPos)(ticket, w);
    },
    movimiento_entrada: (w) => {
        const ticket = {
            id_movimiento: 12,
            tipo: 'entrada_manual',
            fecha: '2026-07-09',
            monto: 50000,
            motivo: 'Cambio adicional para turno noche',
            metodo: 'efectivo',
            registrado_por: 'Admin Demo',
            creado_en: DEMO_EMITIDA,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, w);
    },
    movimiento_salida: (w) => {
        const ticket = {
            id_movimiento: 13,
            tipo: 'salida_manual',
            fecha: '2026-07-09',
            monto: 30000,
            motivo: 'Compra urgente de insumos',
            metodo: 'efectivo',
            registrado_por: 'Admin Demo',
            creado_en: DEMO_EMITIDA,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, w);
    },
    items_menu: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            items: [
                { nombre_producto: 'Bandeja paisa', categoria_nombre: 'Platos fuertes', cantidad: 18, subtotal: 504000 },
                { nombre_producto: 'Sancocho de gallina', categoria_nombre: 'Sopas', cantidad: 9, subtotal: 198000 },
                { nombre_producto: 'Limonada natural', categoria_nombre: 'Bebidas', cantidad: 25, subtotal: 150000 },
                { nombre_producto: 'Postre de natas', categoria_nombre: 'Postres', cantidad: 6, subtotal: 54000 },
            ],
            subtotal_ventas_bruto: 906000,
            total_descuentos_dia: 12000,
            total_facturado: 894000,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildItemsMenuEscPos)(ticket, w);
    },
};
function catalogItemForTipo(tipo) {
    return exports.TICKET_PREVIEW_CATALOG.find((c) => c.id === tipo);
}
function buildSampleEscPosBuffer(tipo, charWidthOrOpts, ctx = {}) {
    const build = SAMPLE_BUILDERS[tipo];
    if (!build) {
        throw new Error(`Tipo de ticket no válido: ${tipo}`);
    }
    return build(charWidthOrOpts, ctx);
}
function buildConfigPreviewEscPos(tipo, opts, numeroFactura) {
    const emitida = new Date().toISOString();
    if (tipo === 'factura') {
        return (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
            numero_factura: numeroFactura,
            emitida_en: emitida,
            detalle_exceso_cobro: {
                monto_recibido_efectivo: 70000,
                vuelto_cliente_efectivo: 10000,
                vuelto_cliente_transferencia: 0,
                pago_domiciliario: 0,
                pago_mesero: 0,
            },
        }), opts);
    }
    if (tipo === 'precuenta') {
        return (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ es_precuenta: true, metodo_pago: undefined, emitida_en: emitida }), opts);
    }
    return SAMPLE_BUILDERS[tipo](opts, {});
}
//# sourceMappingURL=ticket-preview.samples.js.map