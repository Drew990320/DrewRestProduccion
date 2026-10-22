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
exports.ApartadosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const modulo_guard_1 = require("../tenant/modulo.guard");
const apartados_dto_1 = require("./apartados.dto");
const apartados_service_1 = require("./apartados.service");
let ApartadosController = class ApartadosController {
    apartados;
    constructor(apartados) {
        this.apartados = apartados;
    }
    listar(tenantId, estado, idTienda) {
        const tid = idTienda && /^\d+$/.test(idTienda) ? Number(idTienda) : undefined;
        return this.apartados.listar(tenantId, { estado, idTienda: tid });
    }
    obtener(id, tenantId) {
        return this.apartados.obtener(id, tenantId);
    }
    crear(dto, req) {
        return this.apartados.crear(dto, req.user);
    }
    actualizar(id, dto, req) {
        return this.apartados.actualizar(id, dto, req.user);
    }
    abonar(id, dto, req) {
        return this.apartados.abonar(id, dto, req.user);
    }
    entregar(id, req) {
        return this.apartados.entregar(id, req.user);
    }
    cancelar(id, req) {
        return this.apartados.cancelar(id, req.user);
    }
};
exports.ApartadosController = ApartadosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('id_tienda')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "obtener", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [apartados_dto_1.CrearApartadoDto, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, apartados_dto_1.PatchApartadoDto, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Post)(':id/abono'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, apartados_dto_1.AbonoApartadoDto, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "abonar", null);
__decorate([
    (0, common_1.Post)(':id/entregar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "entregar", null);
__decorate([
    (0, common_1.Post)(':id/cancelar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ApartadosController.prototype, "cancelar", null);
exports.ApartadosController = ApartadosController = __decorate([
    (0, common_1.Controller)('apartados'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin', 'mesero'),
    (0, modulo_decorator_1.RequireModulo)('retail'),
    __metadata("design:paramtypes", [apartados_service_1.ApartadosService])
], ApartadosController);
//# sourceMappingURL=apartados.controller.js.map