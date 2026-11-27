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
exports.ParkingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const parking_service_1 = require("./parking.service");
let ParkingController = class ParkingController {
    parking;
    constructor(parking) {
        this.parking = parking;
    }
    settings(tenantId) {
        return this.parking.settings(tenantId);
    }
    putSettings(tenantId, req, body) {
        return this.parking.putSettings(tenantId, req.user.idUsuario, body);
    }
    tipos(tenantId) {
        return this.parking.tipos(tenantId);
    }
    crearTipo(tenantId, body) {
        return this.parking.crearTipo(tenantId, body.nombre);
    }
    actualizarTipo(tenantId, id, body) {
        return this.parking.actualizarTipo(tenantId, id, body);
    }
    tarifas(tenantId) {
        return this.parking.tarifas(tenantId);
    }
    crearTarifa(tenantId, req, body) {
        return this.parking.crearTarifa(tenantId, req.user.idUsuario, body);
    }
    buscar(tenantId, q = '') {
        return this.parking.buscarVehiculos(tenantId, q);
    }
    crearVehiculo(tenantId, body) {
        return this.parking.crearVehiculo(tenantId, body);
    }
    entrada(tenantId, req, body) {
        return this.parking.entrada(tenantId, req.user.idUsuario, body);
    }
    activos(tenantId) {
        return this.parking.activos(tenantId);
    }
    cotizar(tenantId, id) {
        return this.parking.cotizar(tenantId, id);
    }
    pagar(tenantId, req, id, body) {
        return this.parking.pagarTicket(tenantId, req.user.idUsuario, id, body);
    }
    salir(tenantId, req, id, body) {
        return this.parking.salida(tenantId, req.user.idUsuario, id, body.decision);
    }
    planes(tenantId) {
        return this.parking.planes(tenantId);
    }
    crearPlan(tenantId, body) {
        return this.parking.crearPlan(tenantId, body);
    }
    suscripcion(tenantId, req, body) {
        return this.parking.crearSuscripcion(tenantId, req.user.idUsuario, body);
    }
    pagarPlan(tenantId, req, id, body) {
        return this.parking.pagarSuscripcion(tenantId, req.user.idUsuario, id, body);
    }
    descuento(tenantId, req, body) {
        return this.parking.descuento(tenantId, req.user.idUsuario, body);
    }
    suscripciones(tenantId) {
        return this.parking.suscripciones(tenantId);
    }
    compat(tenantId, body) {
        return this.parking.compatibilizar(tenantId, body.id_plan_a, body.id_plan_b);
    }
    reportes(tenantId, desde, hasta) {
        return this.parking.reportes(tenantId, desde, hasta);
    }
};
exports.ParkingController = ParkingController;
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "settings", null);
__decorate([
    (0, common_1.Put)('settings'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "putSettings", null);
__decorate([
    (0, common_1.Get)('vehicle-types'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "tipos", null);
__decorate([
    (0, common_1.Post)('vehicle-types'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "crearTipo", null);
__decorate([
    (0, common_1.Put)('vehicle-types/:id'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "actualizarTipo", null);
__decorate([
    (0, common_1.Get)('rates'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "tarifas", null);
__decorate([
    (0, common_1.Post)('rates'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "crearTarifa", null);
__decorate([
    (0, common_1.Get)('vehicles/search'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)('vehicles'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "crearVehiculo", null);
__decorate([
    (0, common_1.Post)('tickets/entry'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "entrada", null);
__decorate([
    (0, common_1.Get)('tickets/active'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "activos", null);
__decorate([
    (0, common_1.Get)('tickets/:id/quote'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "cotizar", null);
__decorate([
    (0, common_1.Post)('tickets/:id/payments'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "pagar", null);
__decorate([
    (0, common_1.Post)('tickets/:id/exit'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "salir", null);
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "planes", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "crearPlan", null);
__decorate([
    (0, common_1.Post)('subscriptions'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "suscripcion", null);
__decorate([
    (0, common_1.Post)('subscriptions/:id/payments'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "pagarPlan", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "descuento", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "suscripciones", null);
__decorate([
    (0, common_1.Post)('plans/compatibility'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "compat", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('desde')),
    __param(2, (0, common_1.Query)('hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], ParkingController.prototype, "reportes", null);
exports.ParkingController = ParkingController = __decorate([
    (0, common_1.Controller)('parking'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __metadata("design:paramtypes", [parking_service_1.ParkingService])
], ParkingController);
//# sourceMappingURL=parking.controller.js.map