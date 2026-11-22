"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const DEFAULT_CONNECTION_LIMIT = 40;
function datasourceUrl() {
    const raw = process.env.DATABASE_URL;
    if (!raw)
        return undefined;
    const limitEnv = process.env.DATABASE_CONNECTION_LIMIT?.trim();
    const limit = limitEnv && /^\d+$/.test(limitEnv)
        ? limitEnv
        : String(DEFAULT_CONNECTION_LIMIT);
    try {
        const url = new URL(raw);
        if (!url.searchParams.has('connection_limit')) {
            url.searchParams.set('connection_limit', limit);
        }
        if (!url.searchParams.has('pool_timeout')) {
            url.searchParams.set('pool_timeout', '20');
        }
        if (!url.searchParams.has('connect_timeout')) {
            url.searchParams.set('connect_timeout', '10');
        }
        return url.toString();
    }
    catch {
        return raw;
    }
}
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const url = datasourceUrl();
        super(url
            ? {
                datasources: { db: { url } },
                log: process.env.PRISMA_LOG === '1' ? ['query', 'warn'] : ['warn'],
            }
            : { log: process.env.PRISMA_LOG === '1' ? ['query', 'warn'] : ['warn'] });
    }
    async onModuleInit() {
        await this.$connect();
        this.$use(async (params, next) => {
            if (params.model === 'DetallePedido' && params.action === 'create') {
                const data = params.args?.data;
                if (data && data.idUnidad == null && data.idProducto) {
                    const prod = await this.producto.findUnique({
                        where: { idProducto: data.idProducto },
                        select: {
                            idUnidad: true,
                            heredaUnidad: true,
                            categoria: { select: { idRestaurante: true, idUnidad: true } },
                        },
                    });
                    const unidadLinea = prod?.heredaUnidad
                        ? prod.categoria.idUnidad
                        : prod?.idUnidad;
                    if (unidadLinea) {
                        const cfg = await this.configRestaurante.findUnique({
                            where: { idRestaurante: prod.categoria.idRestaurante },
                            select: { moduloUnidadesOperativasActivo: true },
                        });
                        if (cfg?.moduloUnidadesOperativasActivo)
                            data.idUnidad = unidadLinea;
                    }
                }
            }
            if (params.model === 'MovimientoCaja' && params.action === 'create') {
                const data = params.args?.data;
                if (data && data.idUnidad == null && data.idPedido) {
                    const lineas = await this.detallePedido.findMany({
                        where: { idPedido: data.idPedido },
                        select: { idUnidad: true },
                    });
                    const ids = [
                        ...new Set(lineas.map((l) => l.idUnidad).filter((id) => id != null)),
                    ];
                    if (ids.length === 1)
                        data.idUnidad = ids[0];
                }
            }
            return next(params);
        });
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map