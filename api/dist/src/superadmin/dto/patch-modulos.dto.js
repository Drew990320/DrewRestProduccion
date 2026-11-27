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
exports.PatchModulosSuperadminDto = void 0;
const class_validator_1 = require("class-validator");
class PatchModulosSuperadminDto {
    modulo_retail_activo;
    modulo_redondeo_cobro_activo;
    modulo_login_pin_activo;
    modulo_autoservicio_activo;
    modulo_menu_imagenes_activo;
    modulo_produccion_porciones_activo;
    modulo_conexion_movil_activo;
    modulo_envio_correo_activo;
    modulo_impoconsumo_activo;
    modulo_unidades_operativas_activo;
    modulo_restaurantes_multiples_activo;
    modulo_parqueadero_activo;
    modo_inventario_unidades;
}
exports.PatchModulosSuperadminDto = PatchModulosSuperadminDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_retail_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_redondeo_cobro_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_login_pin_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_autoservicio_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_menu_imagenes_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_produccion_porciones_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_conexion_movil_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_envio_correo_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_impoconsumo_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_unidades_operativas_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_restaurantes_multiples_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchModulosSuperadminDto.prototype, "modulo_parqueadero_activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['compartido', 'independiente']),
    __metadata("design:type", String)
], PatchModulosSuperadminDto.prototype, "modo_inventario_unidades", void 0);
//# sourceMappingURL=patch-modulos.dto.js.map