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
exports.SuperadminRestauranteInterceptor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SuperadminRestauranteInterceptor = class SuperadminRestauranteInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async intercept(ctx, next) {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        const raw = req.headers['x-restaurante-id'];
        const id = Number(raw);
        if (user?.rol?.nombre === 'superadmin' &&
            Number.isInteger(id) &&
            id > 0 &&
            id !== user.idRestaurante) {
            const [flag, restaurante] = await Promise.all([
                this.prisma.configRestaurante.findFirst({
                    where: { moduloRestaurantesMultiplesActivo: true },
                    select: { idRestaurante: true },
                }),
                this.prisma.restaurante.findFirst({
                    where: { idRestaurante: id, activo: true },
                    select: { idRestaurante: true },
                }),
            ]);
            if (flag && restaurante) {
                req.user = { ...user, idRestaurante: id };
            }
        }
        return next.handle();
    }
};
exports.SuperadminRestauranteInterceptor = SuperadminRestauranteInterceptor;
exports.SuperadminRestauranteInterceptor = SuperadminRestauranteInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuperadminRestauranteInterceptor);
//# sourceMappingURL=superadmin-restaurante.interceptor.js.map