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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const reservas_dto_1 = require("./reservas.dto");
const reservas_service_1 = require("./reservas.service");
let ReservasController = class ReservasController {
    reservas;
    constructor(reservas) {
        this.reservas = reservas;
    }
    listar(tenantId, fecha, desde, hasta) {
        const ok = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);
        return this.reservas.listar(tenantId, { fecha: ok(fecha), desde: ok(desde), hasta: ok(hasta) });
    }
    crear(dto, req) {
        return this.reservas.crear(dto, req.user);
    }
    actualizar(id, dto, req) {
        return this.reservas.actualizar(id, dto, req.user);
    }
    cobrarAnticipo(id, req) {
        return this.reservas.cobrarAnticipo(id, req.user);
    }
    abrir(id, dto, req) {
        return this.reservas.abrir(id, dto, req.user);
    }
};
exports.ReservasController = ReservasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Query)('desde')),
    __param(3, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String]),
    __metadata("design:returntype", void 0)
], ReservasController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservas_dto_1.CrearReservaDto, Object]),
    __metadata("design:returntype", void 0)
], ReservasController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reservas_dto_1.PatchReservaDto, Object]),
    __metadata("design:returntype", void 0)
], ReservasController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Post)(':id/anticipo'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ReservasController.prototype, "cobrarAnticipo", null);
__decorate([
    (0, common_1.Post)(':id/abrir'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reservas_dto_1.AbrirReservaDto, Object]),
    __metadata("design:returntype", void 0)
], ReservasController.prototype, "abrir", null);
exports.ReservasController = ReservasController = __decorate([
    (0, common_1.Controller)('reservas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin', 'mesero'),
    __metadata("design:paramtypes", [reservas_service_1.ReservasService])
], ReservasController);
//# sourceMappingURL=reservas.controller.js.map