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
exports.RecursosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const modulo_guard_1 = require("../tenant/modulo.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const recurso_dto_1 = require("./dto/recurso.dto");
const pedidos_service_1 = require("../pedidos/pedidos.service");
const recursos_service_1 = require("./recursos.service");
let RecursosController = class RecursosController {
    recursos;
    pedidos;
    constructor(recursos, pedidos) {
        this.recursos = recursos;
        this.pedidos = pedidos;
    }
    dashboard(tenantId) {
        return this.recursos.dashboard(tenantId);
    }
    alertasStock(tenantId) {
        return this.recursos.alertasStock(tenantId);
    }
    listarCategorias(tenantId) {
        return this.recursos.listarCategorias(tenantId);
    }
    crearCategoria(dto, tenantId) {
        return this.recursos.crearCategoria(dto, tenantId);
    }
    actualizarCategoria(id, dto, tenantId) {
        return this.recursos.actualizarCategoria(id, dto, tenantId);
    }
    listarUbicaciones(tenantId) {
        return this.recursos.listarUbicaciones(tenantId);
    }
    crearUbicacion(dto, tenantId) {
        return this.recursos.crearUbicacion(dto, tenantId);
    }
    actualizarUbicacion(id, dto, tenantId) {
        return this.recursos.actualizarUbicacion(id, dto, tenantId);
    }
    listarMovimientos(tenantId, idRecurso, limite) {
        return this.recursos.listarMovimientos(tenantId, {
            id_recurso: idRecurso ? Number(idRecurso) : undefined,
            limite: limite ? Number(limite) : undefined,
        });
    }
    listarAuditoriaStock(tenantId, limite) {
        return this.recursos.listarAuditoriaStock(tenantId, limite ? Number(limite) : undefined);
    }
    migrar(tenantId) {
        return this.recursos.migrarDesdeInventario(tenantId);
    }
    listar(tenantId, idCategoria, idUbicacion, estado, bajoMinimo) {
        return this.recursos.listarRecursos(tenantId, {
            id_categoria: idCategoria ? Number(idCategoria) : undefined,
            id_ubicacion: idUbicacion ? Number(idUbicacion) : undefined,
            estado,
            bajo_minimo: bajoMinimo === '1' || bajoMinimo === 'true',
        });
    }
    crear(dto, tenantId, req) {
        return this.recursos.crearRecurso(dto, tenantId, req.user.idUsuario);
    }
    obtener(id, tenantId) {
        return this.recursos.obtenerRecurso(id, tenantId);
    }
    actualizar(id, dto, tenantId, req) {
        return this.recursos.actualizarRecurso(id, dto, tenantId, req.user);
    }
    async compra(dto, tenantId, req) {
        const ids = [...new Set(dto.lineas.map((l) => l.id_recurso))];
        const recursos = await this.recursos.recursosParaCompra(ids, tenantId);
        for (const l of dto.lineas) {
            const r = recursos.get(l.id_recurso);
            if (!r)
                throw new common_1.BadRequestException(`Artículo ${l.id_recurso} no encontrado`);
            if (l.id_presentacion != null && !r.presentaciones.includes(l.id_presentacion)) {
                throw new common_1.BadRequestException(`La presentación no pertenece a ${r.nombre}`);
            }
        }
        const resultados = [];
        const resumen = [];
        let total = 0;
        let productosRecalculados = 0;
        for (const l of dto.lineas) {
            const res = await this.recursos.registrarMovimiento(l.id_recurso, {
                tipo: 'compra',
                cantidad: l.cantidad,
                id_presentacion: l.id_presentacion,
                costo_unitario: l.costo_unitario,
                fijar_precio: l.fijar_precio,
                observacion: dto.observacion?.trim() || 'Compra',
            }, tenantId, req.user.idUsuario);
            total += Math.round(l.cantidad * (l.costo_unitario ?? 0));
            productosRecalculados += res.recetas_recalculadas?.productos_actualizados ?? 0;
            resumen.push(`${res.nombre} ×${l.cantidad}`);
            resultados.push({
                id_recurso: res.id_recurso,
                nombre: res.nombre,
                stock: res.stock,
                unidad: res.unidad,
                stock_desglose: res.stock_desglose ?? null,
            });
        }
        let salio_de_caja = false;
        let caja_error;
        if (dto.salio_de_caja && total > 0) {
            try {
                await this.pedidos.registrarSalidaCajaCompra({
                    idUsuario: req.user.idUsuario,
                    monto: total,
                    motivo: `Compra: ${resumen.join(', ')}`.slice(0, 250),
                    tenantId,
                });
                salio_de_caja = true;
            }
            catch (e) {
                caja_error = e instanceof Error ? e.message : 'No se pudo registrar la salida de caja';
            }
        }
        return {
            lineas: resultados,
            costo_total: total,
            salio_de_caja,
            caja_error,
            productos_recalculados: productosRecalculados,
        };
    }
    async movimiento(id, dto, tenantId, req) {
        const res = await this.recursos.registrarMovimiento(id, dto, tenantId, req.user.idUsuario);
        const total = Math.round(Math.abs(dto.cantidad) * (dto.costo_unitario ?? 0));
        if (!dto.salio_de_caja || dto.tipo !== 'compra' || total <= 0) {
            return { ...res, salio_de_caja: false };
        }
        try {
            await this.pedidos.registrarSalidaCajaCompra({
                idUsuario: req.user.idUsuario,
                monto: total,
                motivo: `Compra: ${res.nombre}`,
                tenantId,
            });
            return { ...res, salio_de_caja: true, costo_total: total };
        }
        catch (e) {
            return {
                ...res,
                salio_de_caja: false,
                caja_error: e instanceof Error ? e.message : 'No se pudo registrar la salida de caja',
            };
        }
    }
    crearPresentacion(id, dto, tenantId) {
        return this.recursos.crearPresentacion(id, dto, tenantId);
    }
    actualizarPresentacion(id, idPresentacion, dto, tenantId) {
        return this.recursos.actualizarPresentacion(id, idPresentacion, dto, tenantId);
    }
    eliminar(id, tenantId) {
        return this.recursos.eliminarRecurso(id, tenantId);
    }
    eliminarPresentacion(id, idPresentacion, tenantId) {
        return this.recursos.eliminarPresentacion(id, idPresentacion, tenantId);
    }
    convertirUnidad(id, dto, tenantId, req) {
        return this.recursos.convertirUnidad(id, dto, tenantId, req.user);
    }
    listarMantenimientos(id, tenantId) {
        return this.recursos.listarMantenimientos(id, tenantId);
    }
    crearMantenimiento(id, dto, tenantId, req) {
        return this.recursos.registrarMantenimiento(id, dto, tenantId, req.user.idUsuario);
    }
};
exports.RecursosController = RecursosController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('alertas-stock'),
    (0, roles_decorator_1.Roles)('admin', 'chef'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "alertasStock", null);
__decorate([
    (0, common_1.Get)('categorias'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "listarCategorias", null);
__decorate([
    (0, common_1.Post)('categorias'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recurso_dto_1.CrearCategoriaRecursoDto, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "crearCategoria", null);
__decorate([
    (0, common_1.Patch)('categorias/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.ActualizarCategoriaRecursoDto, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "actualizarCategoria", null);
__decorate([
    (0, common_1.Get)('ubicaciones'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "listarUbicaciones", null);
__decorate([
    (0, common_1.Post)('ubicaciones'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recurso_dto_1.CrearUbicacionRecursoDto, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "crearUbicacion", null);
__decorate([
    (0, common_1.Patch)('ubicaciones/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.ActualizarUbicacionRecursoDto, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "actualizarUbicacion", null);
__decorate([
    (0, common_1.Get)('movimientos'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('id_recurso')),
    __param(2, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "listarMovimientos", null);
__decorate([
    (0, common_1.Get)('auditoria-stock'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "listarAuditoriaStock", null);
__decorate([
    (0, common_1.Post)('migrar-desde-inventario'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "migrar", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('id_categoria')),
    __param(2, (0, common_1.Query)('id_ubicacion')),
    __param(3, (0, common_1.Query)('estado')),
    __param(4, (0, common_1.Query)('bajo_minimo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recurso_dto_1.CrearRecursoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "crear", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "obtener", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.ActualizarRecursoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Post)('compras'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recurso_dto_1.CompraRecursosDto, Number, Object]),
    __metadata("design:returntype", Promise)
], RecursosController.prototype, "compra", null);
__decorate([
    (0, common_1.Post)(':id/movimientos'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.CrearMovimientoRecursoDto, Number, Object]),
    __metadata("design:returntype", Promise)
], RecursosController.prototype, "movimiento", null);
__decorate([
    (0, common_1.Post)(':id/presentaciones'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.PresentacionRecursoDto, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "crearPresentacion", null);
__decorate([
    (0, common_1.Patch)(':id/presentaciones/:idPresentacion'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('idPresentacion', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, recurso_dto_1.ActualizarPresentacionRecursoDto, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "actualizarPresentacion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "eliminar", null);
__decorate([
    (0, common_1.Delete)(':id/presentaciones/:idPresentacion'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('idPresentacion', common_1.ParseIntPipe)),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "eliminarPresentacion", null);
__decorate([
    (0, common_1.Post)(':id/convertir-unidad'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.ConvertirUnidadRecursoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "convertirUnidad", null);
__decorate([
    (0, common_1.Get)(':id/mantenimientos'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "listarMantenimientos", null);
__decorate([
    (0, common_1.Post)(':id/mantenimientos'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, recurso_dto_1.CrearMantenimientoRecursoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], RecursosController.prototype, "crearMantenimiento", null);
exports.RecursosController = RecursosController = __decorate([
    (0, common_1.Controller)('recursos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, modulo_decorator_1.RequireModulo)('inventario'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => pedidos_service_1.PedidosService))),
    __metadata("design:paramtypes", [recursos_service_1.RecursosService,
        pedidos_service_1.PedidosService])
], RecursosController);
//# sourceMappingURL=recursos.controller.js.map