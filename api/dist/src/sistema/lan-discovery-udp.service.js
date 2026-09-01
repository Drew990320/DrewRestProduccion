"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var LanDiscoveryUdpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanDiscoveryUdpService = void 0;
const common_1 = require("@nestjs/common");
const dgram = __importStar(require("dgram"));
const lan_discovery_1 = require("@drewrest/shared-domain/lan-discovery");
const red_local_1 = require("./red-local");
let LanDiscoveryUdpService = LanDiscoveryUdpService_1 = class LanDiscoveryUdpService {
    logger = new common_1.Logger(LanDiscoveryUdpService_1.name);
    socket = null;
    onModuleInit() {
        const enabled = process.env.DISCOVERY_UDP_ENABLED?.trim().toLowerCase();
        if (enabled === '0' || enabled === 'false') {
            return;
        }
        const port = Number(process.env.DISCOVERY_UDP_PORT ?? lan_discovery_1.LAN_DISCOVERY_DEFAULT_UDP_PORT);
        if (!Number.isFinite(port) || port < 1 || port > 65535) {
            this.logger.warn('DISCOVERY_UDP_PORT inválido; UDP discovery deshabilitado');
            return;
        }
        const apiPort = Number(process.env.PORT ?? 3000);
        const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        sock.on('error', (err) => {
            this.logger.warn(`UDP discovery error: ${err.message}`);
        });
        sock.on('message', (msg, rinfo) => {
            const text = msg.toString('utf8').trim();
            if (text !== lan_discovery_1.LAN_DISCOVERY_MAGIC)
                return;
            const red = (0, red_local_1.detectarRedLocal)();
            const host = red?.ip ?? rinfo.address;
            if (!host)
                return;
            const payload = JSON.stringify((0, lan_discovery_1.buildLanDiscoveryResponse)({
                host,
                port: apiPort,
                protocol: 'http',
            }));
            sock.send(payload, rinfo.port, rinfo.address, (err) => {
                if (err) {
                    this.logger.debug(`UDP discovery reply failed: ${err.message}`);
                }
            });
        });
        sock.bind(port, '0.0.0.0', () => {
            this.logger.log(`UDP LAN discovery activo en :${port} (magic ${lan_discovery_1.LAN_DISCOVERY_MAGIC})`);
        });
        this.socket = sock;
    }
    onModuleDestroy() {
        if (!this.socket)
            return;
        try {
            this.socket.close();
        }
        catch {
        }
        this.socket = null;
    }
};
exports.LanDiscoveryUdpService = LanDiscoveryUdpService;
exports.LanDiscoveryUdpService = LanDiscoveryUdpService = LanDiscoveryUdpService_1 = __decorate([
    (0, common_1.Injectable)()
], LanDiscoveryUdpService);
//# sourceMappingURL=lan-discovery-udp.service.js.map