/**
 * Vigencia de gastos fijos: desde/hasta qué fecha cuentan y qué días de la semana.
 * Máscara de días: bit 0 = lunes … bit 6 = domingo (ISO).
 */
import { type PeriodoResumen, type RangoPeriodoResumen } from './resumen-periodo';
export declare const DIAS_SEMANA_TODOS = 127;
export declare const DIAS_SEMANA_LUN_SAB = 63;
export declare const DIAS_SEMANA_LUN_VIE = 31;
/** Lunes primero, como el calendario. */
export declare const DIAS_SEMANA_CORTO: readonly ["L", "M", "X", "J", "V", "S", "D"];
export declare const DIAS_SEMANA_NOMBRE: readonly ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export type VigenciaGasto = Readonly<{
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    dias_semana?: number | null;
}>;
export declare function sumarDiasYmd(ymd: string, dias: number): string;
/** 0 = lunes … 6 = domingo. */
export declare function indiceDiaSemana(ymd: string): number;
export declare function normalizarDiasSemana(mask: number | null | undefined): number;
export declare function diaSemanaActivo(mask: number | null | undefined, indice: number): boolean;
export declare function alternarDiaSemana(mask: number | null | undefined, indice: number): number;
export declare function gastoAplicaEnDia(g: VigenciaGasto, ymd: string): boolean;
export declare function diasQueAplican(g: VigenciaGasto, ymds: readonly string[]): string[];
/** Días del mes calendario de `ymd` en que el gasto aplica (para repartir el mensual). */
export declare function diasAplicablesEnMes(g: VigenciaGasto, ymd: string): number;
/** «Todos los días», «Lunes a sábado», «Lun, Mié, Vie», «Todos menos domingo». */
export declare function describirDiasSemana(mask: number | null | undefined): string;
export declare function describirVigencia(g: VigenciaGasto): string;
/** Periodo inmediatamente anterior, del mismo tipo (o misma duración si es personalizado). */
export declare function rangoPeriodoAnterior(periodo: PeriodoResumen, fechaDesde: string, fechaHasta: string): RangoPeriodoResumen | null;
/** Diferencia porcentual frente al periodo anterior (null si el anterior fue 0). */
export declare function variacionPct(actual: number, anterior: number): number | null;
