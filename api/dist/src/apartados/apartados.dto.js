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
exports.AbonoApartadoDto = exports.PatchApartadoDto = exports.CrearApartadoDto = exports.ApartadoItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
class ApartadoItemDto {
    id_producto;
    id_variante;
    cantidad;
}
exports.ApartadoItemDto = ApartadoItemDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ApartadoItemDto.prototype, "id_producto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], ApartadoItemDto.prototype, "id_variante", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(999),
    __metadata("design:type", Number)
], ApartadoItemDto.prototype, "cantidad", void 0);
class CrearApartadoDto {
    id_tienda;
    cliente_nombre;
    cliente_telefono;
    notas;
    fecha_limite;
    items;
}
exports.CrearApartadoDto = CrearApartadoDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CrearApartadoDto.prototype, "id_tienda", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CrearApartadoDto.prototype, "cliente_nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", Object)
], CrearApartadoDto.prototype, "cliente_telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], CrearApartadoDto.prototype, "notas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(FECHA, { message: 'fecha_limite debe ser YYYY-MM-DD' }),
    __metadata("design:type", Object)
], CrearApartadoDto.prototype, "fecha_limite", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ApartadoItemDto),
    __metadata("design:type", Array)
], CrearApartadoDto.prototype, "items", void 0);
class PatchApartadoDto {
    cliente_nombre;
    cliente_telefono;
    notas;
    fecha_limite;
}
exports.PatchApartadoDto = PatchApartadoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PatchApartadoDto.prototype, "cliente_nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", Object)
], PatchApartadoDto.prototype, "cliente_telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], PatchApartadoDto.prototype, "notas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(FECHA, { message: 'fecha_limite debe ser YYYY-MM-DD' }),
    __metadata("design:type", Object)
], PatchApartadoDto.prototype, "fecha_limite", void 0);
class AbonoApartadoDto {
    monto;
}
exports.AbonoApartadoDto = AbonoApartadoDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AbonoApartadoDto.prototype, "monto", void 0);
//# sourceMappingURL=apartados.dto.js.map