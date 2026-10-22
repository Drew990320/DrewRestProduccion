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
exports.ServiciosService = exports.CODIGO_PRODUCTO_ABONO_APARTADO = exports.CODIGO_PRODUCTO_ANTICIPO = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const NOMBRE_CATEGORIA = 'Servicios';
exports.CODIGO_PRODUCTO_ANTICIPO = 'ANTICIPO';
exports.CODIGO_PRODUCTO_ABONO_APARTADO = 'ABONO';
const PRODUCTOS_INTERNOS = {
    [exports.CODIGO_PRODUCTO_ANTICIPO]: 'Anticipo de reserva',
    [exports.CODIGO_PRODUCTO_ABONO_APARTADO]: 'Abono de apartado',
};
const SIN_PRODUCTO_ANTICIPO = {
    OR: [{ codigoMenu: null }, { codigoMenu: { notIn: Object.keys(PRODUCTOS_INTERNOS) } }],
};
function mapServicio(p) {
    return {
        id_producto: p.idProducto,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Math.round(Number(p.precio)),
        activo: p.activo,
    };
}
let ServiciosService = class ServiciosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async idCategoriaServicios(tenantId) {
        const existing = await this.prisma.categoria.findFirst({
            where: { idRestaurante: tenantId, canal: 'servicio' },
            orderBy: { idCategoria: 'asc' },
            select: { idCategoria: true },
        });
        if (existing)
            return existing.idCategoria;
        const created = await this.prisma.categoria.create({
            data: {
                idRestaurante: tenantId,
                nombre: NOMBRE_CATEGORIA,
                canal: 'servicio',
                activo: true,
                esBebida: false,
                visibleEnMostrador: false,
                iconoMenu: 'room-service-outline',
            },
            select: { idCategoria: true },
        });
        return created.idCategoria;
    }
    idProductoAnticipo(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.idProductoInterno(tenantId, exports.CODIGO_PRODUCTO_ANTICIPO);
    }
    idProductoAbonoApartado(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.idProductoInterno(tenantId, exports.CODIGO_PRODUCTO_ABONO_APARTADO);
    }
    async idProductoInterno(tenantId, codigo) {
        const existing = await this.prisma.producto.findFirst({
            where: {
                codigoMenu: codigo,
                categoria: { idRestaurante: tenantId, canal: 'servicio' },
            },
            select: { idProducto: true },
        });
        if (existing)
            return existing.idProducto;
        const idCategoria = await this.idCategoriaServicios(tenantId);
        const created = await this.prisma.producto.create({
            data: {
                idCategoria,
                nombre: PRODUCTOS_INTERNOS[codigo],
                codigoMenu: codigo,
                precio: 0,
                activo: false,
                esPlatoPrincipal: false,
                esEmpacable: false,
                enviaCocina: false,
                controlStock: false,
            },
            select: { idProducto: true },
        });
        return created.idProducto;
    }
    async listar(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, incluirInactivos = false) {
        const rows = await this.prisma.producto.findMany({
            where: {
                categoria: { idRestaurante: tenantId, canal: 'servicio' },
                ...(incluirInactivos ? {} : { activo: true }),
                ...SIN_PRODUCTO_ANTICIPO,
            },
            orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        });
        return rows.map(mapServicio);
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const nombre = dto.nombre.trim();
        if (!nombre)
            throw new common_1.BadRequestException('Nombre requerido');
        if (!(dto.precio > 0))
            throw new common_1.BadRequestException('El precio debe ser mayor a 0');
        const idCategoria = await this.idCategoriaServicios(tenantId);
        const created = await this.prisma.producto.create({
            data: {
                idCategoria,
                nombre,
                descripcion: dto.descripcion?.trim() || null,
                precio: Math.round(dto.precio),
                activo: true,
                esPlatoPrincipal: false,
                esEmpacable: false,
                enviaCocina: false,
                controlStock: false,
            },
        });
        return mapServicio(created);
    }
    async actualizar(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.producto.findFirst({
            where: {
                idProducto: id,
                categoria: { idRestaurante: tenantId, canal: 'servicio' },
                ...SIN_PRODUCTO_ANTICIPO,
            },
        });
        if (!existing)
            throw new common_1.NotFoundException('Servicio no encontrado');
        if (dto.nombre != null && !dto.nombre.trim()) {
            throw new common_1.BadRequestException('Nombre requerido');
        }
        if (dto.precio != null && !(dto.precio > 0)) {
            throw new common_1.BadRequestException('El precio debe ser mayor a 0');
        }
        const updated = await this.prisma.producto.update({
            where: { idProducto: id },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.precio != null ? { precio: Math.round(dto.precio) } : {}),
                ...(dto.descripcion !== undefined
                    ? { descripcion: dto.descripcion?.trim() || null }
                    : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
            },
        });
        return mapServicio(updated);
    }
};
exports.ServiciosService = ServiciosService;
exports.ServiciosService = ServiciosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServiciosService);
//# sourceMappingURL=servicios.service.js.map