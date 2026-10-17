"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_TUTORIAL_ACTIONS = exports.HELP_TUTORIAL_MODULES = exports.HELP_RECORRIDO_ACTIONS = exports.esAccionRecorrido = exports.idRecorridoCompleto = void 0;
exports.normalizarRolHelp = normalizarRolHelp;
exports.modulosHelpParaRol = modulosHelpParaRol;
exports.accionesHelpParaRol = accionesHelpParaRol;
exports.moduloSugeridoPorRuta = moduloSugeridoPorRuta;
exports.accionSugeridaPorRuta = accionSugeridaPorRuta;
exports.pasosTourCompleto = pasosTourCompleto;
exports.pasosDeModulo = pasosDeModulo;
exports.pasosDeAccion = pasosDeAccion;
const help_tutorials_recorrido_1 = require("./help-tutorials-recorrido");
var help_tutorials_recorrido_2 = require("./help-tutorials-recorrido");
Object.defineProperty(exports, "idRecorridoCompleto", { enumerable: true, get: function () { return help_tutorials_recorrido_2.idRecorridoCompleto; } });
Object.defineProperty(exports, "esAccionRecorrido", { enumerable: true, get: function () { return help_tutorials_recorrido_2.esAccionRecorrido; } });
Object.defineProperty(exports, "HELP_RECORRIDO_ACTIONS", { enumerable: true, get: function () { return help_tutorials_recorrido_2.HELP_RECORRIDO_ACTIONS; } });
/** Paso de lectura: el coach avanza con «Entendido, siguiente». */
function guia(title, body, extra) {
    return { title, body, confirmarEntendido: true, ...extra };
}
exports.HELP_TUTORIAL_MODULES = [
    {
        id: 'inicio',
        title: 'Primeros pasos',
        subtitle: 'Cómo moverte por DrewRest',
        icon: 'compass-outline',
        roles: ['mesero', 'chef', 'admin', 'superadmin'],
        routeHints: ['/mesas', '/login', '/superadmin'],
        steps: [
            guia('El turno, en cuatro zonas', 'DrewRest separa el servicio: salón (mesas y pedidos), cocina, cobro y administración. Cada rol ve solo la barra que le corresponde.', {
                tip: 'En pantallas anchas el menú queda fijo a la izquierda. En el teléfono va abajo.',
            }),
            guia('La barra de tu rol', 'Mesero: Mesas, Pedidos y Cuenta. Si el local los usa, también Mostrador (en la barra compacta, Barra), Pedidos para llevar, Autoservicio y Ayuda. Administrador: lo mismo, más Resumen y Más. Cocina: la cola y Cuenta.', {
                bodyTablet: 'A la izquierda, bajo OPERACIÓN. El administrador cierra con Resumen y Más. Cocina no comparte esa barra: tiene la suya.',
                bodyMovil: 'Las mismas entradas van en la barra inferior. Cuenta (mesero o cocina) o Más (administrador) es el acceso personal o de gestión.',
                buscarTablet: 'Columna izquierda, título OPERACIÓN',
                buscarMovil: 'Barra inferior fija',
            }),
            guia('Cuenta del mesero', 'En Cuenta el mesero ve su promedio de mesas, define un PIN solo suyo y, si lo enciende, anota las propinas que le entran. Ese registro no mueve la caja.', {
                buscar: 'Ítem «Cuenta» al final de Operación',
            }),
            guia('Ayuda en la pantalla donde estás', 'El ícono ? del encabezado abre este coach: tour completo, el módulo de la pantalla y guías por acción. Puedes pausar y retomar.', {
                buscar: 'Ícono ? junto a las notificaciones',
                target: 'help.header',
                listoSi: 'help.ayuda_visible',
            }),
        ],
    },
    {
        id: 'cuenta_mesero',
        title: 'Tu cuenta',
        subtitle: 'PIN, mesas y propinas que anotas',
        icon: 'person-circle-outline',
        roles: ['mesero'],
        routeHints: [],
        steps: [
            guia('Abre Cuenta', 'Cuenta es tu espacio del turno: nombre, promedio de mesas, propinas y PIN. Cerrar sesión está al pie. La X del encabezado solo cierra el panel.', { buscar: 'Ítem «Cuenta» al final de la barra de Operación' }),
            guia('Promedio de mesas', 'Promedio cuenta mesas distintas por día, en los últimos 30 días con servicio. Hoy es el número de mesas distintas que llevas en esta fecha. Una mesa agrupada suma las mesas del grupo.', { buscar: 'Tarjetas Promedio y Hoy, bajo tu nombre' }),
            guia('PIN solo tuyo', 'Definir PIN guarda 4 dígitos distintos al PIN del local. En la pantalla compartida, el PIN del local sigue abriendo la lista; si elegiste tu nombre, después pide el tuyo. En tu celular el correo no cambia.', { buscar: 'Fila «PIN de tu cuenta» → Definir PIN' }),
            guia('Propinas que te entran', 'Enciende Propinas, escribe el monto y pulsa Anotar. El total del día es la suma de lo que registraste. El basurero quita una anotación. Esto no entra al cuadre de caja: el excedente de una transferencia sigue en Resumen.', {
                buscar: 'Interruptor Propinas, campo Monto y botón Anotar',
                tip: 'Si apagas el interruptor, las anotaciones de hoy se conservan.',
            }),
        ],
    },
    {
        id: 'mesas',
        title: 'Mesas y salón',
        subtitle: 'Salón, filtros y otros canales',
        icon: 'grid-outline',
        roles: ['mesero', 'admin'],
        routeHints: ['/mesas', '/mesa/'],
        steps: [
            guia('Mapa por salón', 'Mesas abre el salón activo (Salón principal, auxiliar, terraza u otro lugar). Cada tarjeta es una mesa: número, estado y tiempo.', {
                buscar: 'Pestañas de salón arriba de la grilla',
                pantalla: 'mesas_lista',
                listoSi: 'mesas.en_mapa',
            }),
            guia('Libre, ocupada y filtros', '«Disponible» se puede abrir. Una mesa ocupada muestra el pedido en curso. Todas, Libres y Ocupadas filtran la grilla sin cambiar de salón.', { buscar: 'Botones Todas, Libres y Ocupadas' }),
            guia('Abrir la mesa', 'Toca la tarjeta Disponible y confirma «Abrir mesa». Entras al pedido de esa mesa. Si ya está ocupada, ves el pedido activo.', {
                buscar: 'Tarjeta con texto «Disponible»',
                accion: 'Pulsa la mesa y luego «Abrir mesa».',
                target: 'mesas.tarjeta_mesa',
            }),
            guia('Mostrador, para llevar y ayuda', 'Mostrador (en la barra compacta, Barra) atiende sin mesa. Pedidos para llevar es el canal de recoger. Ayuda, si tienes permiso, muestra pedidos de compañeros para apoyar el pase.', {
                buscar: 'Esos ítems en la barra de Operación',
            }),
            guia('Hoy en sala', 'A la derecha del mapa, el bloque «Hoy en sala» abre con «Resumen»: mesas totales, disponibles, ocupadas y quién tiene mesas abiertas.', { buscar: 'Columna derecha: Hoy en sala → Resumen' }),
        ],
    },
    {
        id: 'pedidos',
        title: 'Tomar pedidos',
        subtitle: 'Menú, personalización y envío a cocina',
        icon: 'restaurant-outline',
        roles: ['mesero', 'admin'],
        routeHints: ['/pedido/', '/menu'],
        steps: [
            guia('Del pedido al menú', 'En la mesa, «Agregar del menú» abre el catálogo del día. En tablet esa acción está en la columna PEDIDO; en el teléfono, en la fila de íconos.', {
                buscarTablet: 'Columna derecha «PEDIDO» → Agregar del menú',
                buscarMovil: 'Fila de íconos del pedido → Agregar del menú',
                target: 'mesa.accion_menu',
            }),
            guia('Agregar con el +', 'Elige la categoría y pulsa + en el producto. El plato entra al pedido al instante. Combos y platos con reparto abren un paso corto antes de sumar.', {
                buscar: 'Chips de categoría y botón + del producto',
                target: 'pedido.agregar_rapido',
                pantalla: 'pedido_menu',
            }),
            guia('Notas para cocina', 'El ícono de nota, o «Notas a cocina» en la línea ya agregada, sirve para omitir un ingrediente o dejar una indicación. Se puede editar antes de pasar a cocina.', { buscar: 'Ícono de nota en el producto, o la línea ya pedida' }),
            guia('Pasar a cocina', '«Pasar a cocina» envía la tanda pendiente. La comanda sale sin precios. Puedes mandar por partes: primero entradas, luego el resto. Hace falta el permiso Enviar a cocina.', {
                buscar: 'Botón «Pasar a cocina» en PEDIDO o en la fila de íconos',
                target: 'mesa.accion_cocina',
            }),
            guia('Transferir, agrupar y mis pedidos', 'Transferir mueve el pedido a otra mesa. Agrupar une mesas libres al mismo pedido; sepáralas antes de cocina si el grupo ya no aplica. «Pedidos» lista tus cuentas abiertas, en orden de llegada.', { buscar: 'Paneles Transferir y Agrupar, e ítem «Pedidos» en la barra' }),
        ],
    },
    {
        id: 'cocina',
        title: 'Cocina',
        subtitle: 'Cola, prioridades y llamar mesero',
        icon: 'flame-outline',
        roles: ['chef', 'admin'],
        routeHints: ['/cocina'],
        steps: [
            guia('Cola de comandas', 'Cocina muestra los platos enviados, ordenados por llegada y prioridad. Cada línea indica mesa y lo que hay que preparar.', {
                buscar: 'Pantalla Cocina',
                pantalla: 'cocina',
                irARuta: '/(app)/cocina',
                listoSi: 'cocina.en_pantalla',
            }),
            guia('Marcar listo', 'Cuando el plato está en el pase, márcalo listo para recoger. El mesero lo ve en sus pedidos y en Ayuda.', { buscar: 'Botón «Marcar listo para recoger» en la línea' }),
            guia('Llamar al mesero', '«Llamar mesero» avisa a quien tiene la mesa. En tablet está en la columna Cocina; en el teléfono, en la fila superior.', {
                buscarTablet: 'Columna derecha «Cocina»',
                buscarMovil: 'Fila superior: Actualizar cola y Llamar mesero',
            }),
            guia('Prioridad', 'El local puede subir la prioridad por hora, por reglas del plato o solo a mano. Eso se define en Configuración, no en cada comanda.', { buscar: 'Más → Sistema → Configuración, prioridad de cocina' }),
        ],
    },
    {
        id: 'cobro',
        title: 'Cuenta y cobro',
        subtitle: 'Cobro, propinas y cuadre',
        icon: 'card-outline',
        roles: ['mesero', 'admin'],
        routeHints: ['/factura', '/resumen-diario'],
        steps: [
            guia('Abrir el cobro', 'Con el pedido abierto, «Cobrar» en la navegación del pedido (Mesas, Mesa, Menú, Cobrar) abre la cuenta. También está «Cobrar / facturar» en las acciones del pedido.', {
                buscar: 'Ítem «Cobrar» en la barra del pedido',
                target: 'nav.pedido_cobrar',
            }),
            guia('Método y confirmación', 'Revisa líneas, descuentos y total. Elige el método de pago y pulsa «Confirmar cobro». Puedes cobrar todo, por persona o un monto parcial; el saldo sigue abierto hasta cerrar.', {
                buscar: 'Título «Cobrar pedido», métodos de pago y botón verde «Confirmar cobro»',
                pantalla: 'pedido_factura',
            }),
            guia('Dos propinas distintas', 'Si el cliente transfiere de más, ese excedente queda en el cuadre de caja para que Resumen cierre. La propina que le entra al mesero se anota aparte, en su Cuenta. Una no sustituye a la otra.', {
                tip: 'Apagar el registro de la cuenta no borra lo ya anotado hoy. Solo oculta el espacio.',
            }),
            guia('Resumen del día', 'El administrador abre «Resumen» para ver ventas, métodos de pago y movimientos de caja. Ahí se cuadra el efectivo, no la libreta personal del mesero.', {
                buscar: 'Ítem «Resumen» en la barra del administrador',
                target: 'nav.caja',
                pantalla: 'resumen_diario',
                irARuta: '/(app)/resumen-diario',
            }),
        ],
    },
    {
        id: 'admin_catalogo',
        title: 'Catálogo',
        subtitle: 'Productos, franjas y promociones',
        icon: 'fast-food-outline',
        roles: ['admin'],
        routeHints: [
            '/menu-admin',
            '/categorias-admin',
            '/descuentos-promociones',
        ],
        steps: [
            guia('Productos y precios', 'Más → Menú → Menú. Ahí creas y editas productos, precios y cómo se arman para cocina. Lo que guardas es lo que el mesero ve al pedir.', {
                buscar: 'Más → sección Menú → Menú',
                target: 'more.menu_admin',
                pantalla: 'menu_admin',
                irARuta: '/(app)/menu-admin',
                listoSi: 'menu_admin.en_pantalla',
            }),
            guia('Cuándo se ve cada categoría', '«Categorías y disponibilidad» define los días en que una categoría sale en el menú. «Menús por franja» cambia la carta según la hora.', {
                buscar: 'Más → Menú → Categorías y disponibilidad, o Menús por franja',
            }),
            guia('Descuentos y promociones', '«Descuentos y promociones» arma reglas que se aplican al pedir o etiquetas que el mesero puede usar. Una promoción automática no es un descuento escrito a mano en la cuenta.', {
                buscar: 'Más → Menú → Descuentos y promociones',
                target: 'more.descuentos',
            }),
        ],
    },
    {
        id: 'admin_operacion',
        title: 'Operación del local',
        subtitle: 'Equipo, mesas y sistema',
        icon: 'settings-outline',
        roles: ['admin'],
        routeHints: [
            '/mesas-admin',
            '/lugares-mesa',
            '/configuracion',
            '/permisos',
            '/meseros-operativos',
            '/personalizacion-visual',
            '/recursos',
            '/inventario',
            '/proveedores',
            '/cuentas-por-pagar',
        ],
        steps: [
            guia('Más, por secciones', 'Más no es una lista suelta. Operación (cocina y vista previa), Menú, Inventario y finanzas, Equipo y mesas, y Sistema. Entra a la sección del trabajo que vas a hacer.', {
                buscar: 'Ítem «Más» en la barra',
                target: 'nav.mas',
                listoSi: 'nav.mas_abierto',
                pantalla: 'nav_mas_abierto',
            }),
            guia('Equipo', 'Usuarios crea meseros y cocina, cambia la clave y marca «Pago de turno» para quien deba salir en Ganancias → Personal. Permisos decide si pueden agregar, enviar a cocina, cobrar, transferir, agrupar o ayudar a compañeros. Beneficios del personal registra soda, almuerzo y otros descuentos del turno.', {
                buscar: 'Más → Equipo y mesas → Usuarios',
                target: 'more.usuarios',
                pantalla: 'usuarios',
                irARuta: '/(app)/usuarios',
                listoSi: 'usuarios.en_pantalla',
            }),
            guia('Mesas del local', 'Gestionar mesas define las mesas físicas y su salón. Lugares de mesas arma los puestos para repartir una cuenta larga. Eso no abre un pedido: el pedido se abre en el mapa de Mesas.', { buscar: 'Más → Equipo y mesas → Gestionar mesas' }),
            guia('Sistema del local', 'Personalización visual cambia logo, colores e íconos. Configuración guarda datos del ticket, PIN del local, módulos activos y prioridad de cocina. Impresoras POS enlaza las impresoras. Conexión móvil muestra el QR para que el equipo entre desde el celular.', {
                buscar: 'Más → Sistema',
                target: 'more.configuracion',
            }),
        ],
    },
    {
        id: 'finanzas',
        title: 'Inventario y finanzas',
        subtitle: 'Stock, caja contable, gastos y deudas',
        icon: 'wallet-outline',
        roles: ['admin'],
        routeHints: [
            '/recursos',
            '/inventario',
            '/compras',
            '/contabilidad',
            '/ganancias',
            '/creditos',
            '/proveedores',
            '/cuentas-por-pagar',
        ],
        steps: [
            guia('Cada módulo anota una cosa', 'Inventario mueve unidades. Compras ingresa un lote de producto vendible. Contabilidad anota dinero y deudas en lenguaje de negocio. Ganancias calcula utilidad. Créditos es lo que te deben los clientes. Resumen cuadra la caja del día.', { buscar: 'Más → Inventario y finanzas' }),
            guia('Inventario y compras', 'En Inventario, «Nuevo artículo» da de alta un insumo. «Entrada de stock» suma lo que llegó; el Kardex guarda el movimiento. Compras es el atajo para un lote de algo que ya vendes en el menú. Una factura de proveedor, en Cuentas por pagar, no sube el stock sola.', {
                buscar: 'Más → Inventario, o Compras',
                pantalla: 'inventario',
                irARuta: '/(app)/recursos',
                listoSi: 'inventario.en_pantalla',
                target: 'inventario.agregar_item',
            }),
            guia('Contabilidad', 'Registrar movimiento clasifica: entró dinero, salió dinero, me deben, debo, o un ajuste interno. El historial lee esos movimientos. Proveedores y cuentas por pagar viven en el mismo hub.', {
                buscar: 'Más → Contabilidad → Registrar movimiento',
                pantalla: 'contabilidad',
                irARuta: '/(app)/contabilidad',
                listoSi: 'contabilidad.en_pantalla',
            }),
            guia('Ganancias', 'Resultado muestra la utilidad del periodo. Gastos lleva fijos y extras. Personal paga el turno de quien marcaste en Usuarios. Costos es lo que te cuesta cada producto del menú.', {
                buscar: 'Más → Ganancias → Resultado, Gastos, Personal, Costos',
            }),
            guia('Créditos', 'Créditos guarda clientes que pagan después y sus abonos. No es una propina ni un movimiento de caja hasta que el dinero entra.', { buscar: 'Más → Inventario y finanzas → Créditos' }),
        ],
    },
    {
        id: 'conexion_movil',
        title: 'Conexión móvil',
        subtitle: 'QR para celulares del equipo',
        icon: 'phone-portrait-outline',
        roles: ['admin'],
        routeHints: ['/conexion-movil'],
        steps: [
            guia('Misma red, o la demo', 'En el local, el QR apunta a la IP del servidor. Los celulares tienen que estar en la misma Wi‑Fi. En la demo pública el QR abre el acceso por internet.', {
                pantalla: 'conexion_movil',
                irARuta: '/(app)/conexion-movil',
                listoSi: 'conexion.en_pantalla',
                buscar: 'Más → Sistema → Conexión móvil',
                target: 'more.conexion',
            }),
            guia('QR y enlace', 'Muestra el código o copia la URL y mándala por chat. Quien abre el enlace entra al login del turno, con correo o con el PIN del local.', { buscar: 'Código QR y botón para copiar la URL', target: 'conexion.qr' }),
        ],
    },
    {
        id: 'superadmin',
        title: 'Panel de soporte',
        subtitle: 'Acceso, pruebas y mantenimiento',
        icon: 'shield-checkmark-outline',
        roles: ['superadmin'],
        routeHints: ['/superadmin'],
        steps: [
            guia('Acceso del local', 'Desde aquí activas o bloqueas el restaurante y la fecha límite de licencia. El equipo del local no ve este panel.', {
                pantalla: 'superadmin',
                listoSi: 'superadmin.en_pantalla',
            }),
            guia('Equipo inicial', 'En Equipo del restaurante creas administrador, cocina y meseros con su clave, listos para entregar el turno.', { buscar: 'Equipo del restaurante' }),
            guia('Purgar con cuidado', 'Puedes vaciar historial de pedidos sin tocar el menú, o purgar menú, inventario, mesas y lugares. Cada purga pide confirmación. En un local de pruebas, el siguiente pedido puede volver a empezar en 1.', { buscar: 'Purgar datos' }),
        ],
    },
];
exports.HELP_TUTORIAL_ACTIONS = [
    {
        id: 'como_usar_coach',
        title: 'Cómo funciona la guía activa',
        subtitle: 'Demostración del coach DrewRest',
        moduleId: 'inicio',
        roles: ['mesero', 'chef', 'admin', 'superadmin'],
        routeHints: [],
        screenIds: [
            'general',
            'mesas_lista',
            'mesa_detalle',
            'pedido_menu',
            'inventario',
            'vista_previa_tickets',
            'configuracion',
            'cocina',
        ],
        steps: [
            {
                title: '1. Abre la ayuda',
                body: 'El coach vive en el botón ? del header, junto a las notificaciones.',
                buscar: 'Ícono de ayuda (?) arriba a la derecha',
                accion: 'Pulsa para abrir el panel de ayuda.',
                target: 'help.header',
                listoSi: 'help.ayuda_visible',
            },
            {
                title: '2. Elige «Guíame paso a paso»',
                body: 'En el menú de ayuda verás una tarjeta azul «Guíame paso a paso». Esa opción activa el coach sobre la tarea de esta pantalla.',
                buscar: 'Tarjeta destacada en el panel de ayuda',
                accion: 'Abre el menú de ayuda con el botón de abajo si no lo ves.',
                listoSi: 'help.hub_abierto',
                pantalla: 'help_hub',
            },
            {
                title: '3. Sigue el resaltado',
                body: 'Toca el elemento con borde brillante. El coach salta pasos cumplidos, muestra checklist y puedes pausar para retomar después.',
                tip: 'Usa «Saltar paso» si ya dominas esa parte; «Pausar guía» guarda tu progreso.',
            },
        ],
    },
    {
        id: 'gestionar_inventario',
        title: 'Gestionar inventario interno',
        subtitle: 'Alta, entradas y kardex',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['inventario'],
        routeHints: ['/recursos', '/inventario'],
        steps: [
            {
                title: '1. Qué controla esta pantalla',
                body: 'Inventario lleva ingredientes, insumos y vendibles. El stock no se edita a mano: cada cambio es un movimiento en el Kardex.',
                buscar: 'Cabecera «Inventario» con el resumen y las pestañas',
                listoSi: 'inventario.en_pantalla',
                pantalla: 'inventario',
                irARuta: '/(app)/recursos',
            },
            {
                title: '2. Alta de un producto o insumo',
                body: 'Código, nombre, categoría y unidad. Si ya llegó mercadería, ponla en stock inicial: queda en el Kardex como Entrada.',
                buscar: 'Botón «Nuevo artículo» en la cabecera',
                accion: 'Pulsa para abrir el formulario de alta.',
                target: 'inventario.agregar_item',
                listoSi: 'inventario.tiene_items',
                pantalla: 'inventario',
            },
            {
                title: '3. Entrada de stock (reposición)',
                body: 'En la tarjeta del ítem, «Entrada de stock» suma unidades al inventario. Consumo, pérdida u otros van en «Otros movimientos».',
                buscar: 'Botón «Entrada de stock» en la tarjeta de un artículo (pestaña Artículos)',
                accion: 'Pulsa para registrar la cantidad que acabas de recibir.',
                target: 'inventario.movimiento_entrada',
                pantalla: 'inventario',
                tip: 'Si aún no hay ítems, completa el paso 2 primero.',
            },
            {
                title: '4. Compras (lotes de vendibles)',
                body: 'En Más → Inventario y finanzas → Compras ingresas un lote de producto vendible (gaseosas, porciones, etc.) sin factura.',
                buscar: 'Más → Inventario y finanzas → Compras',
                irARuta: '/(app)/compras',
                pantalla: 'compras',
                listoSi: 'compras.en_pantalla',
            },
        ],
    },
    {
        id: 'ingreso_rapido_vendibles',
        title: 'Compras: lotes de vendibles',
        subtitle: 'Sumar un lote al stock del menú',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['compras', 'inventario'],
        routeHints: ['/compras', '/ingreso-stock', '/recursos'],
        steps: [
            {
                title: '1. Abre Compras',
                body: 'En Más, sección Inventario y finanzas, está Compras. Junto a Inventario, Contabilidad y Ganancias.',
                buscar: 'Más → Inventario y finanzas → Compras',
                listoSi: 'compras.en_pantalla',
                pantalla: 'compras',
                irARuta: '/(app)/compras',
            },
            {
                title: '2. Ingresa el lote',
                body: 'Busca el producto vendible, indica cuántas unidades llegaron e Ingresar lote. Si se arma con receta, usa Registrar lote para descontar insumos y sumar unidades al menú.',
                buscar: 'Stepper de cantidad y botón Ingresar lote',
                pantalla: 'compras',
                listoSi: 'compras.en_pantalla',
                tip: 'El gasto con factura de compra se podrá cargar en este mismo módulo más adelante.',
            },
        ],
    },
    {
        id: 'abrir_mesa_pedido',
        title: 'Abrir pedido en una mesa',
        subtitle: 'Desde el mapa de mesas',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['mesas_lista'],
        routeHints: ['/mesas'],
        steps: [
            {
                title: '1. Ubica la mesa libre',
                body: 'En el mapa, las mesas libres se distinguen por color y el texto «Disponible».',
                buscar: 'Tarjetas numeradas en la grilla de mesas',
                accion: 'Identifica el número de mesa que vas a atender.',
                listoSi: 'mesas.en_mapa',
                pantalla: 'mesas_lista',
            },
            {
                title: '2. Abre la mesa',
                body: 'Al tocar la tarjeta entras al detalle de esa mesa.',
                buscar: 'Toca la tarjeta de la mesa',
                accion: 'Pulsa la mesa libre del cliente.',
                target: 'mesas.tarjeta_mesa',
                listoSi: 'mesa.en_detalle',
                pantalla: 'mesas_lista',
            },
            {
                title: '3. Inicia el pedido',
                body: 'Si no hay pedido abierto, el sistema te pedirá comensales o abrirá el menú.',
                buscar: 'Botón «Abrir mesa» (subtítulo «Nuevo pedido en el salón»)',
                accion: 'Pulsa «Abrir mesa».',
                target: 'mesa.abrir_pedido',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                tip: 'Si la mesa ya está ocupada, verás el pedido activo directamente.',
            },
        ],
    },
    {
        id: 'leer_estado_mesas',
        title: 'Entender el estado de las mesas',
        subtitle: 'Colores y subtítulos del mapa',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['mesas_lista'],
        routeHints: ['/mesas'],
        steps: [
            {
                title: 'Libre vs ocupada',
                body: 'Libre = puedes sentar clientes. Ocupada = hay pedido o cuenta en curso.',
                buscar: 'Subtítulo bajo el número de mesa',
            },
            {
                title: 'Mesas agrupadas',
                body: 'Si ves «5+6» o «Con M5», varias mesas físicas comparten un solo pedido.',
                buscar: 'Etiqueta de grupo en la tarjeta',
            },
        ],
    },
    {
        id: 'tomar_pedido_mesa',
        title: 'Tomar pedido en la mesa',
        subtitle: 'Del detalle de mesa al menú',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle'],
        routeHints: ['/mesa/'],
        steps: [
            {
                title: '1. Revisa el pedido actual',
                body: 'En el detalle ves líneas ya pedidas, estado y total pendiente.',
                buscar: 'Lista de ítems del pedido',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Abre el menú',
                body: 'Desde aquí agregas platos y bebidas nuevas.',
                buscar: 'Botón «Agregar del menú» en la barra de íconos (o columna PEDIDO en tablet)',
                accion: 'Pulsa «Agregar del menú».',
                target: 'mesa.accion_menu',
                listoSi: 'pedido.en_menu',
                pantalla: 'mesa_detalle',
            },
            {
                title: '3. Agregar del menú',
                body: 'Usa el + para agregar al instante. El ícono de nota abre cantidad, omitir ingredientes y notas a cocina antes de agregar. Combos abren una pantalla corta. También puedes editar notas después en el pedido.',
                buscar: 'Botón + del producto · texto de ayuda bajo el título del menú',
                accion: 'Agrega un plato con el +.',
                target: 'pedido.agregar_rapido',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '4. Categoría y producto',
                body: 'Si hay varias categorías, filtra arriba. Cada fila muestra precio; el + suma al pedido.',
                buscar: 'Chips de categoría y listado de platos',
                accion: 'Ubica el producto que vas a pedir.',
                target: 'pedido.producto_tarjeta',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
                tip: 'Con una sola categoría el listado ya está listo.',
            },
            {
                title: '5. Agrega al pedido',
                body: 'Pulsa el + azul a la derecha del plato. Luego, en la mesa, usa «Notas a cocina» en la línea si hace falta.',
                buscar: 'Botón + del producto',
                accion: 'Suma al menos un ítem, o confirma que entendiste el flujo.',
                target: 'pedido.agregar_item_dinamico',
                listoSi: 'pedido.agrego_item',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
        ],
    },
    {
        id: 'agregar_producto_pedido',
        title: 'Agregar productos al pedido',
        subtitle: 'Categorías, personalización y cantidad',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_menu', 'pedido_raiz'],
        routeHints: ['/pedido/', '/menu'],
        steps: [
            {
                title: '1. Agregar del menú',
                body: 'El + agrega al instante. Combos y platos con reparto abren una pantalla corta. Notas e ingredientes a omitir se editan después en la mesa.',
                buscar: 'Botón + del producto · texto de ayuda del menú',
                accion: 'Lee la ayuda y agrega un plato con el +.',
                target: 'pedido.agregar_rapido',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '2. Elige categoría',
                body: 'Las categorías del día aparecen en la barra superior del menú (iconos, nombres, o ambos, según personalización visual).',
                buscar: 'Chips o pestañas de categorías arriba del listado',
                accion: 'Toca la categoría del producto que vas a pedir.',
                target: 'pedido.menu_categoria',
                listoSi: 'pedido.categoria_ok',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '3. Selecciona el producto',
                body: 'Usa el + para sumar. Combos y subítems pueden pedir un paso extra al agregar.',
                buscar: 'Fila del plato o bebida con precio',
                accion: 'Toca el + del producto.',
                target: 'pedido.producto_tarjeta',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '4. Agrega al pedido',
                body: 'Pulsa el + a la derecha. En la mesa, «Notas a cocina» en cada línea para nota u omitir ingredientes.',
                buscar: 'Botón + del producto',
                accion: 'Agrega un ítem o pulsa «Entendido» si ya dominas el flujo.',
                target: 'pedido.agregar_item_dinamico',
                listoSi: 'pedido.agrego_item',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
                tip: 'El ítem queda en el pedido; puedes editar notas antes de enviar a cocina.',
            },
        ],
    },
    {
        id: 'enviar_cocina_mesa',
        title: 'Enviar comanda a cocina',
        subtitle: 'Desde el detalle de mesa',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle'],
        routeHints: ['/mesa/'],
        steps: [
            {
                title: '1. Verifica líneas pendientes',
                body: 'Solo los platos de comida nuevos deben ir a cocina (no bebidas ya listas).',
                buscar: 'Ítems sin marca de enviado',
                listoSi: 'mesa.tiene_lineas',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Pasa a cocina',
                body: 'Se imprime la comanda sin precios para la cocina.',
                buscar: 'Botón «Pasar a cocina» en la barra de acciones',
                accion: 'Pulsa y confirma si te lo pide.',
                target: 'mesa.accion_cocina',
                listoSi: 'pedido.platos_en_cocina',
                pantalla: 'mesa_detalle',
                tip: 'Necesitas permiso «Enviar a cocina».',
            },
        ],
    },
    {
        id: 'enviar_cocina_pedido',
        title: 'Enviar tanda a cocina',
        subtitle: 'Desde el menú del pedido',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_menu', 'pedido_raiz'],
        routeHints: ['/pedido/'],
        steps: [
            {
                title: '1. Termina de agregar',
                body: 'Puedes enviar por tandas: primero entradas, luego fuertes.',
                accion: 'Agrega los ítems de esta tanda.',
            },
            {
                title: '2. Envía a cocina',
                buscar: 'Botón «Pasar a cocina» en la barra de íconos (o columna PEDIDO en tablet)',
                accion: 'Pulsa «Pasar a cocina».',
            },
        ],
    },
    {
        id: 'ir_a_cobro',
        title: 'Ir a cobrar la mesa',
        subtitle: 'Abrir factura desde la mesa',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle'],
        routeHints: ['/mesa/', '/factura'],
        steps: [
            {
                title: '1. Cliente pide la cuenta',
                body: 'Revisa que no falten ítems por enviar o cobrar.',
                buscar: 'Total pendiente en el detalle',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Abre factura',
                buscar: 'Botón «Cobrar / facturar» o ítem «Cobrar» en la barra de navegación del pedido',
                accion: 'Pulsa para abrir «Cobrar pedido #…».',
                target: 'mesa.accion_cobrar',
                listoSi: 'pedido.en_factura',
                pantalla: 'mesa_detalle',
            },
        ],
    },
    {
        id: 'cobrar_pedido',
        title: 'Cobrar el pedido completo',
        subtitle: 'Método de pago y cierre',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_factura'],
        routeHints: ['/factura'],
        steps: [
            {
                title: '1. Revisa la cuenta',
                body: 'Verifica líneas, descuentos y promociones aplicadas.',
                buscar: 'Lista de ítems y total',
            },
            {
                title: '2. Elige forma de cobro',
                buscar: 'Efectivo, tarjeta, transferencia u otros métodos',
                accion: 'Selecciona el método que usó el cliente.',
            },
            {
                title: '3. Confirma el cobro',
                buscar: 'Botón verde «Confirmar cobro» al pie de la pantalla',
                accion: 'Confirma el cobro. La mesa se libera si no queda saldo.',
                tip: 'Si el cliente paga solo una parte, usa «Cobro parcial».',
            },
        ],
    },
    {
        id: 'agrupar_mesas',
        title: 'Agrupar mesas',
        subtitle: 'Varias mesas, un solo pedido',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle', 'pedido_menu'],
        routeHints: ['/mesa/'],
        steps: [
            {
                title: '1. Mesa principal con pedido',
                body: 'Debe existir un pedido abierto en la mesa donde se sentó el grupo.',
                buscar: 'Detalle de mesa ocupada',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Agregar mesa libre',
                buscar: 'Panel «Agrupar mesas» · botón «Agregar mesa libre»',
                accion: 'Elige en el mapa una mesa libre adyacente.',
                target: 'mesa.agrupar_mesas',
                listoSi: 'mesa.mesas_agrupadas',
                pantalla: 'mesa_detalle',
            },
            {
                title: '3. Listo — grupo activo',
                body: 'Las mesas anexas aparecen en el detalle y en el mapa como grupo.',
                listoSi: 'mesa.mesas_agrupadas',
                pantalla: 'mesa_detalle',
            },
        ],
    },
    {
        id: 'transferir_pedido',
        title: 'Transferir pedido a otra mesa',
        subtitle: 'Mover cuenta completa',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle', 'pedido_menu'],
        routeHints: ['/pedido/', '/mesa/'],
        steps: [
            {
                title: '1. Cuándo transferir',
                body: 'El cliente cambió de mesa, o un pedido de para llevar/mostrador se sienta: muévelo a una libre, o a una ocupada (segunda cuenta, sin agrupar). El empaque no se quita solo; el administrador lo baja con −.',
                tip: 'Si quieren una sola cuenta en varias mesas físicas, usa «Agrupar mesas».',
            },
            {
                title: '2. Abre transferir',
                buscar: 'Sección «Transferir a otra mesa» o ícono de intercambio',
                accion: 'Pulsa «Elegir mesa destino».',
            },
            {
                title: '3. Confirma',
                buscar: 'Mapa de mesas libres u ocupadas',
                accion: 'Toca la mesa destino y confirma. En ocupada verás chips de pedidos como en bebidas.',
            },
        ],
    },
    {
        id: 'cobro_parcial',
        title: 'Cobro parcial o por persona',
        subtitle: 'Pagos sin cerrar toda la cuenta',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_factura'],
        routeHints: ['/factura'],
        steps: [
            {
                title: '1. Plan de cobro',
                body: 'Puedes cobrar por comensales del plan, monto libre o selección.',
                buscar: 'Opciones de plan de personas o monto',
                accion: 'Elige el tipo de cobro parcial.',
            },
            {
                title: '2. Registra el pago',
                buscar: 'Método de pago y monto',
                accion: 'Ingresa lo que paga ahora y confirma.',
            },
            {
                title: '3. Saldo restante',
                body: 'El pedido sigue abierto hasta cobrar el total.',
                buscar: 'Indicador de pendiente en factura',
            },
        ],
    },
    {
        id: 'precuenta_ticket',
        title: 'Imprimir pre-cuenta',
        subtitle: 'Ticket antes del cobro final',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_factura'],
        routeHints: ['/factura'],
        steps: [
            {
                title: '1. Cliente revisa antes de pagar',
                buscar: 'Botón «Pre-cuenta» o ícono de impresora',
                accion: 'Pulsa para generar el ticket de revisión.',
            },
            {
                title: '2. Entrega al cliente',
                body: 'No cierra la mesa; solo muestra el detalle.',
            },
        ],
    },
    {
        id: 'marcar_listo_cocina',
        title: 'Marcar platos listos',
        subtitle: 'Flujo en cocina',
        moduleId: 'cocina',
        roles: ['chef', 'admin'],
        screenIds: ['cocina'],
        routeHints: ['/cocina'],
        steps: [
            {
                title: '1. Cola de pedidos',
                buscar: 'Lista ordenada por prioridad y llegada',
                accion: 'Abre el pedido que estás preparando.',
            },
            {
                title: '2. Marca listo',
                buscar: 'Checkbox o botón en cada línea',
                accion: 'Marca las líneas terminadas.',
            },
            {
                title: '3. Mesero recoge',
                body: 'El mesero ve avisos de «listo para recoger» en su pantalla.',
            },
        ],
    },
    {
        id: 'llamar_mesero_cocina',
        title: 'Llamar al mesero desde cocina',
        subtitle: 'Aviso de pase',
        moduleId: 'cocina',
        roles: ['chef', 'admin'],
        screenIds: ['cocina'],
        routeHints: ['/cocina'],
        steps: [
            {
                title: '1. Plato en pase',
                body: 'Cuando necesitas que retiren o lleven algo a la mesa.',
                buscar: 'Botón flotante en cocina (esquina)',
                accion: 'Pulsa y elige el pedido/mesero.',
            },
        ],
    },
    {
        id: 'vista_previa_tickets',
        title: 'Vista previa tickets',
        subtitle: 'PDF sin impresora física',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['vista_previa_tickets'],
        routeHints: ['/vista-previa-impresion'],
        steps: [
            {
                title: '1. Elige un formato',
                body: 'Cada tarjeta simula un ticket térmico de 58 mm (comanda, cuenta, etc.).',
                buscar: 'Lista de formatos agrupados por tipo',
                accion: 'Toca un formato para previsualizarlo en pantalla.',
                target: 'vista_previa.primer_formato',
                listoSi: 'vista_previa.en_pantalla',
                pantalla: 'vista_previa_tickets',
                irARuta: '/(app)/vista-previa-impresion',
            },
            {
                title: '2. Genera PDF o vista',
                body: 'Se abre un modal con el ticket tal como saldría del POS.',
                buscar: 'Botón «Ver vista previa» en la tarjeta',
                accion: 'Confirma en el modal; puedes descargar PDF si el navegador lo permite.',
                tip: 'Usa el logo de Personalización visual en los tickets.',
            },
        ],
    },
    {
        id: 'conexion_qr',
        title: 'Conectar celulares con QR',
        subtitle: 'Módulo conexión móvil',
        moduleId: 'conexion_movil',
        roles: ['admin'],
        screenIds: ['conexion_movil'],
        routeHints: ['/conexion-movil'],
        steps: [
            {
                title: '1. Pantalla de conexión',
                body: 'Aquí tienes dos QR: uno para descargar el APK y otro para vincular el celular a este local.',
                buscar: 'Título «Conexión móvil» y texto introductorio',
                listoSi: 'conexion.en_pantalla',
                pantalla: 'conexion_movil',
                irARuta: '/(app)/conexion-movil',
            },
            {
                title: '2. Escanea el QR',
                body: 'Primero el QR de descarga (APK). Luego, en la app, el QR de vincular.',
                buscar: 'Dos códigos QR: Descargar app y Vincular este local',
                accion: 'Pide al mesero que instale el APK y luego escanee el QR 2.',
                target: 'conexion.qr',
                pantalla: 'conexion_movil',
                tip: 'En local: misma Wi‑Fi. En demo en la nube: con internet.',
            },
            {
                title: '3. Copiar enlace',
                body: 'Si el QR no funciona, comparte la URL manualmente.',
                buscar: 'Caja con la dirección web y texto «Toca para copiar»',
                accion: 'Pulsa para copiar y envía por WhatsApp o mensaje.',
                target: 'conexion.copiar_url',
                pantalla: 'conexion_movil',
            },
        ],
    },
    {
        id: 'ayuda_companeros',
        title: 'Ayudar a un compañero',
        subtitle: 'Cubrir pedidos ajenos',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['ayuda_companeros'],
        routeHints: ['/ayuda-companeros'],
        steps: [
            {
                title: '1. Ver pedidos del equipo',
                buscar: 'Pantalla «Ayudar a compañeros»',
                accion: 'Revisa mesas con avisos de tu equipo.',
            },
            {
                title: '2. Tomar acción',
                buscar: 'Pedido del compañero',
                accion: 'Recoge platos listos o atiende la mesa según permisos.',
            },
        ],
    },
    {
        id: 'revisar_caja_dia',
        title: 'Revisar caja del día',
        subtitle: 'Resumen diario',
        moduleId: 'cobro',
        roles: ['admin', 'superadmin'],
        screenIds: ['resumen_diario'],
        routeHints: ['/resumen-diario'],
        steps: [
            {
                title: '1. Ventas y métodos',
                buscar: 'Totales por efectivo, transferencia, etc.',
            },
            {
                title: '2. Detalle por mesa',
                buscar: 'Sección «Detalle por mesa y pedido»',
                accion: 'Expande mesas para ver cobros.',
            },
            {
                title: '3. Propina de caja',
                body: 'El excedente de una transferencia queda en este cuadre. La propina que el mesero anota en Cuenta no entra aquí.',
                confirmarEntendido: true,
            },
        ],
    },
    {
        id: 'crear_producto_menu',
        title: 'Crear producto en el menú',
        subtitle: 'Administración de catálogo',
        moduleId: 'admin_catalogo',
        roles: ['admin'],
        screenIds: ['menu_admin'],
        routeHints: ['/menu-admin'],
        steps: [
            {
                title: '1. Nuevo producto',
                buscar: 'Botón agregar en menú admin',
                accion: 'Pulsa para abrir el formulario.',
            },
            {
                title: '2. Precio y categoría',
                accion: 'Completa nombre, precio, categoría y opciones de cocina.',
            },
            {
                title: '3. Guardar',
                buscar: 'Guardar / confirmar',
                accion: 'El producto aparece en el menú del mesero.',
            },
        ],
    },
    {
        id: 'configurar_permiso_mesero',
        title: 'Configurar permiso de mesero',
        subtitle: 'Quién puede cobrar, cocina, etc.',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['permisos'],
        routeHints: ['/permisos'],
        steps: [
            {
                title: '1. Abre permisos',
                buscar: 'Más → Equipo y mesas → Permisos. Grupos: Pedido y cocina, Cobro y anulación, Mesas y equipo.',
            },
            {
                title: '2. Activa o desactiva',
                buscar: 'Interruptores por acción (cobrar, agrupar mesas…)',
                accion: 'Guarda los cambios.',
            },
        ],
    },
    {
        id: 'control_acceso_restaurante',
        title: 'Controlar acceso al restaurante',
        subtitle: 'Panel superadmin',
        moduleId: 'superadmin',
        roles: ['superadmin'],
        screenIds: ['superadmin'],
        routeHints: ['/superadmin'],
        steps: [
            {
                title: '1. Estado activo',
                buscar: 'Interruptor «Activo»',
                accion: 'Desactiva para bloquear logins del local.',
            },
            {
                title: '2. Fecha límite',
                buscar: 'Campo de fecha y «Guardar»',
                accion: 'Opcional: vencimiento de licencia demo.',
            },
        ],
    },
    {
        id: 'cuenta_del_mesero',
        title: 'Tu cuenta: PIN y propinas',
        subtitle: 'Lo que el mesero registra para sí',
        moduleId: 'cuenta_mesero',
        roles: ['mesero'],
        screenIds: ['mesas_lista', 'general'],
        routeHints: ['/mesas', '/mis-pedidos'],
        steps: [
            guia('1. Abre Cuenta', 'Es el último ítem de Operación. Ahí está tu nombre, el promedio de mesas y el acceso a cerrar sesión.', { buscar: 'Barra de Operación → Cuenta' }),
            guia('2. PIN de tu cuenta', 'Cuatro dígitos distintos al PIN del local. En una pantalla compartida, después de elegir tu nombre se pide este PIN.', { buscar: 'Fila «PIN de tu cuenta»' }),
            guia('3. Anota una propina', 'Enciende Propinas, escribe el monto y pulsa Anotar. El total es solo lo que registraste. No mueve la caja ni el excedente de transferencia.', { buscar: 'Interruptor Propinas → Monto → Anotar' }),
        ],
    },
    ...help_tutorials_recorrido_1.HELP_RECORRIDO_ACTIONS,
];
function normalizarRolHelp(rol) {
    if (!rol)
        return null;
    if (rol === 'superadmin')
        return 'superadmin';
    if (rol === 'admin')
        return 'admin';
    if (rol === 'chef')
        return 'chef';
    if (rol === 'mesero')
        return 'mesero';
    return null;
}
function modulosHelpParaRol(rol) {
    return exports.HELP_TUTORIAL_MODULES.filter((m) => m.roles.includes(rol));
}
function accionesHelpParaRol(rol) {
    return exports.HELP_TUTORIAL_ACTIONS.filter((a) => a.roles.includes(rol) && !(0, help_tutorials_recorrido_1.esAccionRecorrido)(a.id));
}
function coincideRuta(pathname, hints) {
    return hints.some((h) => pathname.includes(h));
}
function moduloSugeridoPorRuta(pathname, rol) {
    const modulos = modulosHelpParaRol(rol);
    const hit = modulos.find((m) => coincideRuta(pathname, m.routeHints));
    return hit ?? modulos.find((m) => m.id === 'inicio') ?? null;
}
function accionSugeridaPorRuta(pathname, rol) {
    // Delegado al ranking contextual; import dinámico evitado — usar guiaPrincipal en app.
    const acciones = accionesHelpParaRol(rol);
    const ranked = acciones
        .map((a) => ({
        a,
        score: a.routeHints.filter((h) => pathname.includes(h)).length,
    }))
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score);
    return ranked[0]?.a ?? null;
}
function pasosTourCompleto(rol) {
    return pasosDeAccion((0, help_tutorials_recorrido_1.idRecorridoCompleto)(rol));
}
function pasosDeModulo(moduleId) {
    const mod = exports.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId);
    return mod?.steps ?? [];
}
function pasosDeAccion(actionId) {
    const act = exports.HELP_TUTORIAL_ACTIONS.find((a) => a.id === actionId);
    return act?.steps ?? [];
}
