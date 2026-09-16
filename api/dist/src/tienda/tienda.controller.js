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
exports.TiendaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const modulo_guard_1 = require("../tenant/modulo.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const tienda_service_1 = require("./tienda.service");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CrearTiendaDto {
    nombre;
    etiqueta;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CrearTiendaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", Object)
], CrearTiendaDto.prototype, "etiqueta", void 0);
class PatchTiendaDto {
    nombre;
    etiqueta;
    activo;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PatchTiendaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", Object)
], PatchTiendaDto.prototype, "etiqueta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchTiendaDto.prototype, "activo", void 0);
class CrearCategoriaTiendaDto {
    nombre;
    id_tienda;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CrearCategoriaTiendaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearCategoriaTiendaDto.prototype, "id_tienda", void 0);
class PatchCategoriaTiendaDto {
    nombre;
    activo;
    id_tienda;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], PatchCategoriaTiendaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchCategoriaTiendaDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchCategoriaTiendaDto.prototype, "id_tienda", void 0);
class CrearProductoTiendaDto {
    id_categoria;
    nombre;
    precio;
    descripcion;
    control_stock;
    stock_disponible;
    id_tienda;
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearProductoTiendaDto.prototype, "id_categoria", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CrearProductoTiendaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CrearProductoTiendaDto.prototype, "precio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CrearProductoTiendaDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CrearProductoTiendaDto.prototype, "control_stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CrearProductoTiendaDto.prototype, "stock_disponible", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearProductoTiendaDto.prototype, "id_tienda", void 0);
class PatchProductoTiendaDto {
    id_categoria;
    nombre;
    precio;
    descripcion;
    activo;
    control_stock;
    stock_disponible;
    id_tienda;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchProductoTiendaDto.prototype, "id_categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], PatchProductoTiendaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PatchProductoTiendaDto.prototype, "precio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], PatchProductoTiendaDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchProductoTiendaDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchProductoTiendaDto.prototype, "control_stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PatchProductoTiendaDto.prototype, "stock_disponible", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchProductoTiendaDto.prototype, "id_tienda", void 0);
class UpsertVarianteDto {
    id_variante;
    nombre;
    etiqueta_grupo;
    precio;
    stock_disponible;
    activo;
    orden;
    id_tienda;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertVarianteDto.prototype, "id_variante", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpsertVarianteDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", Object)
], UpsertVarianteDto.prototype, "etiqueta_grupo", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertVarianteDto.prototype, "precio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertVarianteDto.prototype, "stock_disponible", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertVarianteDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpsertVarianteDto.prototype, "orden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertVarianteDto.prototype, "id_tienda", void 0);
class AbrirVentaDto {
    id_tienda;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AbrirVentaDto.prototype, "id_tienda", void 0);
function parseIdTiendaQuery(raw) {
    if (raw == null || raw === '')
        return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : undefined;
}
let TiendaController = class TiendaController {
    tienda;
    constructor(tienda) {
        this.tienda = tienda;
    }
    listarTiendas(tenantId) {
        return this.tienda.listarTiendas(tenantId);
    }
    crearTienda(dto, tenantId) {
        return this.tienda.crearTienda(dto, tenantId);
    }
    actualizarTienda(id, dto, tenantId) {
        return this.tienda.actualizarTienda(id, dto, tenantId);
    }
    listarCategorias(tenantId, idTienda) {
        return this.tienda.listarCategorias(tenantId, parseIdTiendaQuery(idTienda));
    }
    crearCategoria(dto, tenantId) {
        return this.tienda.crearCategoria(dto.nombre, tenantId, dto.id_tienda);
    }
    actualizarCategoria(id, dto, tenantId) {
        return this.tienda.actualizarCategoria(id, dto, tenantId, dto.id_tienda);
    }
    listarProductos(tenantId, idTienda) {
        return this.tienda.listarProductos(tenantId, parseIdTiendaQuery(idTienda));
    }
    crearProducto(dto, tenantId) {
        return this.tienda.crearProducto(dto, tenantId, dto.id_tienda);
    }
    actualizarProducto(id, dto, tenantId) {
        return this.tienda.actualizarProducto(id, dto, tenantId, dto.id_tienda);
    }
    upsertVariante(id, dto, tenantId) {
        return this.tienda.upsertVariante(id, dto, tenantId, dto.id_tienda);
    }
    eliminarVariante(id, idVariante, tenantId, idTienda) {
        return this.tienda.eliminarVariante(id, idVariante, tenantId, parseIdTiendaQuery(idTienda));
    }
    catalogo(tenantId, idTienda) {
        return this.tienda.catalogoVenta(tenantId, parseIdTiendaQuery(idTienda));
    }
    ventasAbiertas(tenantId, idTienda) {
        return this.tienda.listarVentasAbiertas(tenantId, parseIdTiendaQuery(idTienda));
    }
    abrirVenta(req, dto, tenantId) {
        return this.tienda.abrirVenta({ idUsuario: req.user.idUsuario, rol: req.user.rol }, tenantId, dto?.id_tienda);
    }
};
exports.TiendaController = TiendaController;
__decorate([
    (0, common_1.Get)('tiendas'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "listarTiendas", null);
__decorate([
    (0, common_1.Post)('tiendas'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CrearTiendaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "crearTienda", null);
__decorate([
    (0, common_1.Patch)('tiendas/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, PatchTiendaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "actualizarTienda", null);
__decorate([
    (0, common_1.Get)('categorias'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('id_tienda')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "listarCategorias", null);
__decorate([
    (0, common_1.Post)('categorias'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CrearCategoriaTiendaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "crearCategoria", null);
__decorate([
    (0, common_1.Patch)('categorias/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, PatchCategoriaTiendaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "actualizarCategoria", null);
__decorate([
    (0, common_1.Get)('productos'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('id_tienda')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "listarProductos", null);
__decorate([
    (0, common_1.Post)('productos'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CrearProductoTiendaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "crearProducto", null);
__decorate([
    (0, common_1.Patch)('productos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, PatchProductoTiendaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "actualizarProducto", null);
__decorate([
    (0, common_1.Put)('productos/:id/variantes'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpsertVarianteDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "upsertVariante", null);
__decorate([
    (0, common_1.Delete)('productos/:id/variantes/:idVariante'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('idVariante', common_1.ParseIntPipe)),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Query)('id_tienda')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "eliminarVariante", null);
__decorate([
    (0, common_1.Get)('catalogo'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('id_tienda')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "catalogo", null);
__decorate([
    (0, common_1.Get)('venta/abiertas'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('id_tienda')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "ventasAbiertas", null);
__decorate([
    (0, common_1.Post)('venta/abrir'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AbrirVentaDto, Number]),
    __metadata("design:returntype", void 0)
], TiendaController.prototype, "abrirVenta", null);
exports.TiendaController = TiendaController = __decorate([
    (0, common_1.Controller)('tienda'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    (0, modulo_decorator_1.RequireModulo)('retail'),
    __metadata("design:paramtypes", [tienda_service_1.TiendaService])
], TiendaController);
//# sourceMappingURL=tienda.controller.js.map