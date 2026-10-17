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
exports.QuitarPropinaDto = exports.AnotarPropinaDto = exports.MostrarPropinasDto = exports.SetPinPersonalDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class SetPinPersonalDto {
    pin;
}
exports.SetPinPersonalDto = SetPinPersonalDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value != null && value !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}$/, { message: 'El PIN debe tener 4 dígitos' }),
    __metadata("design:type", Object)
], SetPinPersonalDto.prototype, "pin", void 0);
class MostrarPropinasDto {
    mostrar;
}
exports.MostrarPropinasDto = MostrarPropinasDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MostrarPropinasDto.prototype, "mostrar", void 0);
class AnotarPropinaDto {
    monto;
}
exports.AnotarPropinaDto = AnotarPropinaDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5_000_000),
    __metadata("design:type", Number)
], AnotarPropinaDto.prototype, "monto", void 0);
class QuitarPropinaDto {
    id;
}
exports.QuitarPropinaDto = QuitarPropinaDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuitarPropinaDto.prototype, "id", void 0);
//# sourceMappingURL=cuenta-mesero.dto.js.map