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
exports.GuardarPlanoDto = exports.PosicionPlanoMesaDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const mesa_visual_1 = require("@drewrest/shared-domain/mesa-visual");
const mesa_plano_1 = require("@drewrest/shared-domain/mesa-plano");
class PosicionPlanoMesaDto {
    id_mesa;
    plano_x;
    plano_y;
    plano_forma;
}
exports.PosicionPlanoMesaDto = PosicionPlanoMesaDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PosicionPlanoMesaDto.prototype, "id_mesa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(mesa_plano_1.PLANO_ANCHO),
    __metadata("design:type", Object)
], PosicionPlanoMesaDto.prototype, "plano_x", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(mesa_plano_1.PLANO_ALTO),
    __metadata("design:type", Object)
], PosicionPlanoMesaDto.prototype, "plano_y", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...mesa_visual_1.MESA_FORMA_IDS]),
    __metadata("design:type", Object)
], PosicionPlanoMesaDto.prototype, "plano_forma", void 0);
class GuardarPlanoDto {
    mesas;
}
exports.GuardarPlanoDto = GuardarPlanoDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosicionPlanoMesaDto),
    __metadata("design:type", Array)
], GuardarPlanoDto.prototype, "mesas", void 0);
//# sourceMappingURL=guardar-plano.dto.js.map