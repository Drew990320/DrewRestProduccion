"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApartadosModule = void 0;
const common_1 = require("@nestjs/common");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const permisos_module_1 = require("../permisos/permisos.module");
const servicios_module_1 = require("../servicios/servicios.module");
const tenant_module_1 = require("../tenant/tenant.module");
const tienda_module_1 = require("../tienda/tienda.module");
const apartados_controller_1 = require("./apartados.controller");
const apartados_service_1 = require("./apartados.service");
let ApartadosModule = class ApartadosModule {
};
exports.ApartadosModule = ApartadosModule;
exports.ApartadosModule = ApartadosModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule, pedidos_module_1.PedidosModule, permisos_module_1.PermisosModule, servicios_module_1.ServiciosModule, tienda_module_1.TiendaModule],
        controllers: [apartados_controller_1.ApartadosController],
        providers: [apartados_service_1.ApartadosService],
    })
], ApartadosModule);
//# sourceMappingURL=apartados.module.js.map