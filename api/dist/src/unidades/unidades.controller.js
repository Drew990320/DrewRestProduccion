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
exports.UnidadesController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const unidades_service_1 = require("./unidades.service");
class CrearUnidadDto {
    nombre;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CrearUnidadDto.prototype, "nombre", void 0);
class PatchUnidadDto {
    nombre;
    activo;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], PatchUnidadDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchUnidadDto.prototype, "activo", void 0);
class IdsDto {
    ids;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], IdsDto.prototype, "ids", void 0);
let UnidadesController = class UnidadesController {
    unidades;
    constructor(unidades) {
        this.unidades = unidades;
    }
    listar(tenantId) {
        return this.unidades.listar(tenantId);
    }
    crear(tenantId, dto) {
        return this.unidades.crear(tenantId, dto.nombre);
    }
    actualizar(tenantId, id, dto) {
        return this.unidades.actualizar(tenantId, id, dto);
    }
    usuarios(tenantId, id, dto) {
        return this.unidades.asignarUsuarios(tenantId, id, dto.ids ?? []);
    }
    productos(tenantId, id, dto) {
        return this.unidades.asignarProductos(tenantId, id, dto.ids ?? []);
    }
};
exports.UnidadesController = UnidadesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UnidadesController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, CrearUnidadDto]),
    __metadata("design:returntype", void 0)
], UnidadesController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, PatchUnidadDto]),
    __metadata("design:returntype", void 0)
], UnidadesController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Put)(':id/usuarios'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, IdsDto]),
    __metadata("design:returntype", void 0)
], UnidadesController.prototype, "usuarios", null);
__decorate([
    (0, common_1.Put)(':id/productos'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, IdsDto]),
    __metadata("design:returntype", void 0)
], UnidadesController.prototype, "productos", null);
exports.UnidadesController = UnidadesController = __decorate([
    (0, common_1.Controller)('unidades'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __metadata("design:paramtypes", [unidades_service_1.UnidadesService])
], UnidadesController);
//# sourceMappingURL=unidades.controller.js.map