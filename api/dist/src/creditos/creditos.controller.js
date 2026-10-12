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
exports.CreditosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const modulo_guard_1 = require("../tenant/modulo.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const creditos_service_1 = require("./creditos.service");
const crear_cuenta_credito_dto_1 = require("./dto/crear-cuenta-credito.dto");
const abono_cuenta_credito_dto_1 = require("./dto/abono-cuenta-credito.dto");
const cliente_credito_dto_1 = require("./dto/cliente-credito.dto");
let CreditosController = class CreditosController {
    creditos;
    constructor(creditos) {
        this.creditos = creditos;
    }
    listar(todos, tenantId) {
        return this.creditos.listar(todos !== '1' && todos !== 'true', tenantId);
    }
    crear(dto, req, tenantId) {
        return this.creditos.crear(dto, req.user.id, tenantId);
    }
    abono(id, dto, req, tenantId) {
        return this.creditos.registrarAbono(id, dto, tenantId, req.user.id);
    }
    listarClientes(q, tenantId) {
        return this.creditos.listarClientes(q, tenantId);
    }
    detalleCliente(id, tenantId) {
        return this.creditos.detalleCliente(id, tenantId);
    }
    crearCliente(dto, tenantId) {
        return this.creditos.crearCliente(dto, tenantId);
    }
    actualizarCliente(id, dto, tenantId) {
        return this.creditos.actualizarCliente(id, dto, tenantId);
    }
    abonarCliente(id, dto, req, tenantId) {
        return this.creditos.abonarCliente(id, dto, tenantId, req.user.id);
    }
};
exports.CreditosController = CreditosController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Query)('todos')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_cuenta_credito_dto_1.CrearCuentaCreditoDto, Object, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id/abono'),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, abono_cuenta_credito_dto_1.AbonoCuentaCreditoDto, Object, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "abono", null);
__decorate([
    (0, common_1.Get)('clientes'),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "listarClientes", null);
__decorate([
    (0, common_1.Get)('clientes/:id'),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "detalleCliente", null);
__decorate([
    (0, common_1.Post)('clientes'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cliente_credito_dto_1.CrearClienteCreditoDto, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "crearCliente", null);
__decorate([
    (0, common_1.Patch)('clientes/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cliente_credito_dto_1.ActualizarClienteCreditoDto, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "actualizarCliente", null);
__decorate([
    (0, common_1.Post)('clientes/:id/abono'),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, abono_cuenta_credito_dto_1.AbonoCuentaCreditoDto, Object, Number]),
    __metadata("design:returntype", void 0)
], CreditosController.prototype, "abonarCliente", null);
exports.CreditosController = CreditosController = __decorate([
    (0, common_1.Controller)('creditos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, modulo_decorator_1.RequireModulo)('creditos'),
    __metadata("design:paramtypes", [creditos_service_1.CreditosService])
], CreditosController);
//# sourceMappingURL=creditos.controller.js.map