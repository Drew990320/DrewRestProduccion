import { type MesasVirtualesConfig } from './mesa-label';
export type DetalleTransferenciaLike = {
    es_bebida?: boolean;
    es_acompanamiento_mazorca?: boolean;
    esAcompanamientoMazorca?: boolean;
    es_empacable?: boolean;
    esEmpacable?: boolean;
    categoria_nombre?: string;
    id_detalle_padre?: number | null;
    idDetallePadre?: number | null;
};
export declare function pedidoDebeTenerLineaMazorca(mesaNumero: number, detalles: DetalleTransferenciaLike[], mazorcaActiva?: boolean): boolean;
export type ResultadoValidacionTransferencia = {
    accion: 'mover';
    mensaje_confirmacion: string;
} | {
    accion: 'rechazar';
    mensaje: string;
};
/**
 * Transferencia a mesa física (no 97/98/99).
 * Origen para llevar o mostrador: se sienta en mesa (el empaque no se quita solo).
 * Autoservicio en esas colas: igual, asignar mesa.
 * - Libre: mueve la cuenta.
 * - Ocupada: segunda cuenta, sin agrupar mesas.
 */
export declare function validarTransferenciaPedido(input: {
    origen_mesa_numero: number;
    destino_mesa_numero: number;
    destino_libre: boolean;
    destino_es_anexa?: boolean;
    mesas_virtuales?: MesasVirtualesConfig | null;
    /** Autoservicio en mostrador/para llevar: permite asignar a mesa física. */
    origen_autoservicio?: boolean;
}): ResultadoValidacionTransferencia;
export declare const AYUDA_TRANSFERENCIA_PEDIDO = "Elige mesa libre u ocupada. En ocupada queda como segunda cuenta (sin agrupar). Desde para llevar o mostrador tambi\u00E9n puedes sentar el pedido; el empaque no se quita solo (el administrador lo baja con \u2212).";
export declare const AYUDA_ASIGNAR_MESA_AUTOSERVICIO = "Elige una mesa f\u00EDsica libre u ocupada para asignar este autoservicio. En ocupada queda como cuenta separada (sin agrupar).";
