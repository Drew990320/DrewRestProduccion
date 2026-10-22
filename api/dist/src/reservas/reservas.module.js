"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservasModule = void 0;
const common_1 = require("@nestjs/common");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const servicios_module_1 = require("../servicios/servicios.module");
const tenant_module_1 = require("../tenant/tenant.module");
const reservas_controller_1 = require("./reservas.controller");
const reservas_service_1 = require("./reservas.service");
let ReservasModule = class ReservasModule {
};
exports.ReservasModule = ReservasModule;
exports.ReservasModule = ReservasModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule, pedidos_module_1.PedidosModule, servicios_module_1.ServiciosModule],
        controllers: [reservas_controller_1.ReservasController],
        providers: [reservas_service_1.ReservasService],
    })
], ReservasModule);
//# sourceMappingURL=reservas.module.js.map