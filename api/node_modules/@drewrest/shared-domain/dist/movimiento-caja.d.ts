export type TipoMovimientoCaja = 'devolucion_exceso_transferencia' | 'entrada_manual' | 'salida_manual' | 'pago_domicilio' | 'pago_mesero' | 'cuota_gasto_fijo';
export type MetodoDevolucionExceso = 'efectivo' | 'transferencia';
/** Destino del exceso cuando el cliente transfirió más del total del pedido. */
export type ExcesoTransferenciaDestino = MetodoDevolucionExceso | 'domicilio' | 'mesero';
export type MovimientoCajaLike = {
    tipo: TipoMovimientoCaja;
    monto: number;
    metodo_devolucion?: MetodoDevolucionExceso | null;
};
/** Efectivo o transferencia; null/omitido = efectivo (entradas históricas). */
export declare function metodoMovimientoCaja(m: Pick<MovimientoCajaLike, 'metodo_devolucion'>): MetodoDevolucionExceso;
/** Impacto en efectivo físico en caja (+ entra, − sale). */
export declare function impactoMovimientoCajaEfectivo(m: MovimientoCajaLike): number;
export declare function etiquetaTipoMovimientoCaja(tipo: TipoMovimientoCaja): string;
export declare function resumenImpactoMovimientosCaja(movimientos: MovimientoCajaLike[]): {
    /** Solo efectivo (entra a caja física). */
    total_entradas_manual: number;
    total_entradas_manual_transferencia: number;
    /** Solo efectivo (sale de caja física). */
    total_salidas_manual: number;
    total_salidas_manual_transferencia: number;
    total_devoluciones_efectivo: number;
    total_pagos_domicilio: number;
    total_pagos_mesero_exceso: number;
    total_cuotas_gasto_fijo: number;
    neto_movimientos_caja: number;
};
export type ConceptoSalidaDinero = 'devolucion_efectivo' | 'pago_domicilio' | 'propina_mesero' | 'pago_turno_mesero' | 'salida_manual_efectivo' | 'devolucion_transferencia' | 'salida_manual_transferencia';
export type FilaSalidaDinero = {
    concepto: ConceptoSalidaDinero;
    etiqueta: string;
    cantidad: number;
    monto: number;
};
export type PropinaPorMesero = {
    mesero: string;
    cantidad: number;
    monto: number;
};
export type ResumenSalidasDinero = {
    /** Sale de la caja física. */
    efectivo: FilaSalidaDinero[];
    /** Sale de la cuenta bancaria. */
    transferencia: FilaSalidaDinero[];
    total_efectivo: number;
    total_transferencia: number;
    total: number;
    propinas_por_mesero: PropinaPorMesero[];
};
/**
 * Dinero que salió, separado por origen (caja física vs. banco). El total en efectivo
 * coincide con las salidas del cuadre de caja (fondos de gasto fijo no cuentan).
 */
export declare function resumenSalidasDinero(movimientos: (MovimientoCajaLike & {
    mesero_pedido?: string | null;
})[], pagosTurnoMeseros?: {
    cantidad: number;
    monto: number;
}): ResumenSalidasDinero;
export type CuadreCajaEfectivoInput = {
    monto_base_efectivo: number;
    ventas_efectivo: number;
    total_pagos_meseros?: number;
    movimientos?: MovimientoCajaLike[];
};
export type CuadreCajaEfectivo = {
    monto_base_efectivo: number;
    ventas_efectivo: number;
    total_pagos_meseros: number;
    total_entradas_manual: number;
    total_entradas_manual_transferencia: number;
    total_salidas_manual: number;
    total_salidas_manual_transferencia: number;
    total_devoluciones_efectivo: number;
    total_pagos_domicilio: number;
    total_pagos_mesero_exceso: number;
    total_cuotas_gasto_fijo: number;
    /** Caja inicial + ventas efectivo + entradas manuales */
    subtotal_entradas_caja: number;
    /** Pagos meseros + salidas manuales + devoluciones + domicilios + mesero (exceso). Fondos de gasto fijo no salen de caja. */
    subtotal_salidas_caja: number;
    /** subtotal_entradas_caja − subtotal_salidas_caja */
    efectivo_esperado_en_caja: number;
    neto_movimientos_caja: number;
};
/**
 * Cuadre de efectivo físico en caja.
 * Prioriza agrupar entradas y salidas antes de restar:
 *   (base + ventas + entradas) − (pagos meseros + salidas + devoluciones + domicilios + mesero exceso)
 * Las cuotas de fondo de gasto fijo se descuentan de ganancia, no del efectivo.
 */
export declare function calcularEfectivoEsperadoEnCaja(input: CuadreCajaEfectivoInput): CuadreCajaEfectivo;
