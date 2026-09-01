/**
 * Protocolo de descubrimiento LAN DrewRest (sin Internet).
 * Compartido entre API (UDP responder) y clientes (HTTP/UDP probe).
 */
export declare const LAN_DISCOVERY_MAGIC: "DREWREST_DISCOVER_v1";
export declare const LAN_DISCOVERY_RESPONSE_TYPE: "drewrest_discovery";
export declare const LAN_DISCOVERY_VERSION: 1;
export declare const LAN_DISCOVERY_DEFAULT_UDP_PORT = 41234;
export type LanDiscoveryResponse = {
    type: typeof LAN_DISCOVERY_RESPONSE_TYPE;
    version: typeof LAN_DISCOVERY_VERSION;
    service: 'drewrest-api';
    host: string;
    port: number;
    protocol: 'http' | 'https';
};
export declare function isPrivateIpv4Host(host: string): boolean;
/** Prefijo /24 de una IPv4, p. ej. 192.168.0.198 → 192.168.0 */
export declare function ipv4Prefix(ip: string): string | null;
/** Candidatos cercanos (±5 y gateways típicos) — fase rápida. */
export declare function buildNearbyLanUrls(host: string, port: string | number): string[];
/** Escaneo /24 completo — solo en rediscovery tras fallo (DHCP). */
export declare function buildSubnetScanUrls(prefix: string, port: string | number, opts?: {
    excludeHost?: string;
}): string[];
export declare function buildLanDiscoveryResponse(input: {
    host: string;
    port: number;
    protocol?: 'http' | 'https';
}): LanDiscoveryResponse;
export declare function parseLanDiscoveryResponse(raw: string): LanDiscoveryResponse | null;
export declare function lanDiscoveryResponseToBaseUrl(r: LanDiscoveryResponse): string;
