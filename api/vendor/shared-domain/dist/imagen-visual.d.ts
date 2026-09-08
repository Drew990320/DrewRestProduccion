/** Tamaño del logo en factura / ticket (alto máximo; siempre contain). */
export declare const LOGO_TICKET_TAMANO_IDS: readonly ["chico", "medio", "grande"];
export type LogoTicketTamanoId = (typeof LOGO_TICKET_TAMANO_IDS)[number];
export declare const LOGO_TICKET_TAMANO_LABELS: Record<LogoTicketTamanoId, string>;
export declare const LOGO_TICKET_TAMANO_DESCRIPCION: Record<LogoTicketTamanoId, string>;
export declare function esLogoTicketTamanoValido(id: string | null | undefined): id is LogoTicketTamanoId;
export declare function resolverLogoTicketTamano(guardado?: string | null): LogoTicketTamanoId;
export declare function logoTicketMaxAltoPx(id?: string | null): number;
/** Alto del marco de foto en tarjetas del menú. */
export declare const MENU_IMAGEN_ALTURA_IDS: readonly ["compacta", "normal", "grande"];
export type MenuImagenAlturaId = (typeof MENU_IMAGEN_ALTURA_IDS)[number];
export declare const MENU_IMAGEN_ALTURA_LABELS: Record<MenuImagenAlturaId, string>;
export declare const MENU_IMAGEN_ALTURA_DESCRIPCION: Record<MenuImagenAlturaId, string>;
export declare function esMenuImagenAlturaValida(id: string | null | undefined): id is MenuImagenAlturaId;
export declare function resolverMenuImagenAltura(guardado?: string | null): MenuImagenAlturaId;
export declare function menuImagenAlturaPx(id?: string | null): number;
/** Cómo encaja la foto en el marco. */
export declare const MENU_IMAGEN_AJUSTE_IDS: readonly ["contain", "cover"];
export type MenuImagenAjusteId = (typeof MENU_IMAGEN_AJUSTE_IDS)[number];
export declare const MENU_IMAGEN_AJUSTE_LABELS: Record<MenuImagenAjusteId, string>;
export declare const MENU_IMAGEN_AJUSTE_DESCRIPCION: Record<MenuImagenAjusteId, string>;
export declare function esMenuImagenAjusteValido(id: string | null | undefined): id is MenuImagenAjusteId;
export declare function resolverMenuImagenAjuste(guardado?: string | null): MenuImagenAjusteId;
