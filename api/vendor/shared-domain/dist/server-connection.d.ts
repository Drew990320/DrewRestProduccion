export declare const SERVER_CONNECTION_QR_TYPE: "server_connection";
export declare const SERVER_CONNECTION_QR_VERSION: 1;
export type ServerProtocol = 'http' | 'https';
export type ServerConnection = {
    host: string;
    port: number;
    protocol: ServerProtocol;
    apiBasePath: string;
};
export type ServerConnectionQr = ServerConnection & {
    type: typeof SERVER_CONNECTION_QR_TYPE;
    version: number;
};
export declare function isForbiddenPairHost(host: string): boolean;
export declare function isValidServerHost(host: string): boolean;
export declare function isValidServerPort(port: number): boolean;
export declare function normalizeApiBasePath(raw: unknown): string | null;
export declare function unwrapNipIoHost(hostname: string): string;
export declare function serverConnectionToBaseUrl(cfg: ServerConnection): string;
export declare function parseBaseUrlToServerConnection(raw: string): ServerConnection | null;
export declare function buildServerConnection(input: {
    host: string;
    port: number | string;
    protocol?: string;
    apiBasePath?: string;
}): ServerConnection | null;
export declare function buildServerConnectionQr(cfg: ServerConnection): ServerConnectionQr;
export declare function buildServerConnectionQrString(cfg: ServerConnection): string;
export declare function isApkDownloadPayload(raw: string): boolean;
/**
 * Extrae host/puerto/protocolo desde QR JSON, deep link, /vincular?api=,
 * IP:puerto o URL http(s). Rechaza QR arbitrarios y el QR de descarga APK.
 */
export declare function parseServerConnectionInput(raw: string): ServerConnection | null;
export declare function sanitizeServerBaseUrl(raw: string | null | undefined): string | null;
export declare function isUsableLanServerUrl(url: string | null | undefined): boolean;
export declare function serverConnectionToInputHostPort(cfg: ServerConnection | null): string;
