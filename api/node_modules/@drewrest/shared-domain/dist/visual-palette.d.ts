import { type VisualColorKey } from './nav-app-icon';
export type ModoTemaVisual = 'claro' | 'oscuro';
export type SugerenciaTemaVisual = {
    claro: Record<VisualColorKey, string>;
    oscuro: Record<VisualColorKey, string>;
};
/** Grupos para vista previa de todos los tokens que usa la app. */
export declare const GRUPOS_VISTA_PALETA_APP: readonly [{
    readonly titulo: "Marca";
    readonly keys: readonly ["primary", "primaryDark", "primaryLight", "secondary", "secondaryDark", "cocina"];
}, {
    readonly titulo: "Fondos";
    readonly keys: readonly ["background", "backgroundAlt", "surface", "surfaceMuted"];
}, {
    readonly titulo: "Texto";
    readonly keys: readonly ["text", "textMuted", "textHint", "onPrimary"];
}, {
    readonly titulo: "Éxito";
    readonly keys: readonly ["success", "successLight", "successText", "successBorder"];
}, {
    readonly titulo: "Aviso";
    readonly keys: readonly ["warning", "warningLight", "warningText", "warningBorder"];
}, {
    readonly titulo: "Error";
    readonly keys: readonly ["danger", "dangerLight", "dangerText", "dangerBorder"];
}, {
    readonly titulo: "Info";
    readonly keys: readonly ["info", "infoLight", "infoText", "infoBorder"];
}, {
    readonly titulo: "Mesas";
    readonly keys: readonly ["mesaLibre", "mesaLibreBg", "mesaOcupada", "mesaOcupadaBg", "mesaReservada", "mesaReservadaBg"];
}, {
    readonly titulo: "Bordes";
    readonly keys: readonly ["border", "borderLight", "borderInput"];
}];
export type TokenColorApp = (typeof GRUPOS_VISTA_PALETA_APP)[number]['keys'][number];
export type ColoresSemanticosDerivados = {
    cocina: string;
    cocinaDark: string;
    success: string;
    successDark: string;
    successLight: string;
    successBorder: string;
    successText: string;
    warning: string;
    warningDark: string;
    warningLight: string;
    warningBorder: string;
    warningText: string;
    danger: string;
    dangerDark: string;
    dangerLight: string;
    dangerBorder: string;
    dangerText: string;
    info: string;
    infoDark: string;
    infoLight: string;
    infoBorder: string;
    infoText: string;
    mesaLibre: string;
    mesaLibreBg: string;
    mesaLibreBorder: string;
    mesaOcupada: string;
    mesaOcupadaBg: string;
    mesaOcupadaBorder: string;
    mesaReservada: string;
    mesaReservadaBg: string;
    mesaReservadaBorder: string;
    prioridadAlta: string;
    prioridadAltaLight: string;
    prioridadAltaText: string;
    prioridadBaja: string;
    prioridadBajaLight: string;
    prioridadBajaText: string;
    offline: string;
    onInfoMuted: string;
    onInfoSoft: string;
};
export declare function modoPaletaVisual(palette: Record<VisualColorKey, string>): ModoTemaVisual;
/** Corrige texto/bordes ilegibles cuando fondo y texto no contrastan. */
export declare function normalizarContrastePaleta(palette: Record<VisualColorKey, string>): Record<VisualColorKey, string>;
/** Estados, mesas y acentos derivados del tema (claro u oscuro). */
export declare function derivarColoresSemanticos(palette: Record<VisualColorKey, string>, modo?: ModoTemaVisual): ColoresSemanticosDerivados;
export declare function generarPaletaClaraDesdePrincipal(primaryHex: string): Record<VisualColorKey, string>;
export declare function generarPaletaOscuraDesdePrincipal(primaryHex: string): Record<VisualColorKey, string>;
export declare function generarSugerenciasTemaDesdePrincipal(primaryHex: string): SugerenciaTemaVisual;
/** Preferencia de tema en un equipo: seguir el sistema operativo o fijar claro/oscuro. */
export type TemaPreferenciaVisual = 'sistema' | ModoTemaVisual;
export declare const TEMA_PREFERENCIA_IDS: readonly TemaPreferenciaVisual[];
export declare function esTemaPreferenciaValida(v: unknown): v is TemaPreferenciaVisual;
export type PaletasTemaVisual = {
    claro: Record<VisualColorKey, string>;
    oscuro: Record<VisualColorKey, string>;
};
/** Tema oscuro coherente con la paleta clara: conserva principal y secundario del usuario. */
export declare function derivarPaletaOscuraDesdeClara(claro: Record<VisualColorKey, string>): Record<VisualColorKey, string>;
/** Tema claro coherente con una paleta oscura (paletas antiguas guardadas en oscuro). */
export declare function derivarPaletaClaraDesdeOscura(oscuro: Record<VisualColorKey, string>): Record<VisualColorKey, string>;
/**
 * Paletas efectivas del restaurante. `colores` es la paleta clara; `coloresOscuro`
 * es la personalización del modo oscuro (si no existe se deriva de la clara).
 */
export declare function resolverPaletasTema(colores: Record<VisualColorKey, string>, coloresOscuro?: Record<VisualColorKey, string> | null): PaletasTemaVisual;
export declare const VISUAL_TONE_IDS: readonly ["pastel", "mate", "natural", "brillante", "intenso"];
export type VisualToneId = (typeof VISUAL_TONE_IDS)[number];
export type VisualTonePreset = {
    id: VisualToneId;
    nombre: string;
    descripcion: string;
};
export declare const VISUAL_TONE_PRESETS: Record<VisualToneId, VisualTonePreset>;
/** Recolorea la paleta conservando el matiz; el tono (pastel/mate/brillante) es idempotente. */
export declare function aplicarTonoPaleta(palette: Record<VisualColorKey, string>, tone: VisualToneId): Record<VisualColorKey, string>;
/** @deprecated Usar generarPaletaClaraDesdePrincipal */
export declare function generarPaletaDesdePrincipal(primaryHex: string): Record<VisualColorKey, string>;
export type PaletaPredisenada = {
    id: string;
    nombre: string;
    descripcion: string;
    muestra: string;
    claro: Record<VisualColorKey, string>;
    oscuro: Record<VisualColorKey, string>;
};
/** Galería de temas listos para aplicar en personalización visual. */
export declare const PALETAS_PREDISENADAS: readonly PaletaPredisenada[];
