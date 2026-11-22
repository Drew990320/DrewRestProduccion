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
exports.UnidadesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UnidadesService = class UnidadesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exigirModulo(tenantId) {
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { moduloUnidadesOperativasActivo: true },
        });
        if (!cfg?.moduloUnidadesOperativasActivo) {
            throw new common_1.BadRequestException('El módulo de cajas independientes no está activo');
        }
    }
    async listar(tenantId) {
        await this.exigirModulo(tenantId);
        const rows = await this.prisma.unidadOperativa.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
            include: {
                usuarios: { select: { idUsuario: true } },
                _count: { select: { productos: true } },
            },
        });
        return rows.map((r) => ({
            id_unidad: r.idUnidad,
            nombre: r.nombre,
            activo: r.activo,
            orden: r.orden,
            id_usuarios: r.usuarios.map((u) => u.idUsuario),
            productos: r._count.productos,
        }));
    }
    async crear(tenantId, nombre) {
        await this.exigirModulo(tenantId);
        const limpio = nombre.trim();
        if (!limpio)
            throw new common_1.BadRequestException('Indica el nombre de la unidad');
        const dup = await this.prisma.unidadOperativa.findFirst({
            where: { idRestaurante: tenantId, nombre: limpio },
        });
        if (dup)
            throw new common_1.BadRequestException('Ya existe una unidad con ese nombre');
        const row = await this.prisma.unidadOperativa.create({
            data: { idRestaurante: tenantId, nombre: limpio },
        });
        return { id_unidad: row.idUnidad, nombre: row.nombre, activo: row.activo };
    }
    async actualizar(tenantId, idUnidad, patch) {
        await this.exigirModulo(tenantId);
        const actual = await this.prisma.unidadOperativa.findFirst({
            where: { idUnidad, idRestaurante: tenantId },
        });
        if (!actual)
            throw new common_1.NotFoundException('Unidad no encontrada');
        const nombre = patch.nombre?.trim();
        const row = await this.prisma.unidadOperativa.update({
            where: { idUnidad },
            data: {
                ...(nombre ? { nombre } : {}),
                ...(patch.activo !== undefined ? { activo: patch.activo } : {}),
            },
        });
        return { id_unidad: row.idUnidad, nombre: row.nombre, activo: row.activo };
    }
    async asignarUsuarios(tenantId, idUnidad, idUsuarios) {
        await this.exigirModulo(tenantId);
        const unidad = await this.prisma.unidadOperativa.findFirst({
            where: { idUnidad, idRestaurante: tenantId },
        });
        if (!unidad)
            throw new common_1.NotFoundException('Unidad no encontrada');
        const ids = [...new Set(idUsuarios.filter((n) => Number.isInteger(n) && n > 0))];
        const validos = await this.prisma.usuario.findMany({
            where: { idRestaurante: tenantId, idUsuario: { in: ids } },
            select: { idUsuario: true },
        });
        const ok = new Set(validos.map((u) => u.idUsuario));
        await this.prisma.$transaction([
            this.prisma.usuarioUnidad.deleteMany({ where: { idUnidad } }),
            this.prisma.usuarioUnidad.createMany({
                data: ids.filter((id) => ok.has(id)).map((idUsuario) => ({ idUsuario, idUnidad })),
            }),
        ]);
        return { id_unidad: idUnidad, id_usuarios: ids.filter((id) => ok.has(id)) };
    }
    async asignarProductos(tenantId, idUnidad, idProductos) {
        await this.exigirModulo(tenantId);
        const unidad = await this.prisma.unidadOperativa.findFirst({
            where: { idUnidad, idRestaurante: tenantId },
        });
        if (!unidad)
            throw new common_1.NotFoundException('Unidad no encontrada');
        const ids = [...new Set(idProductos.filter((n) => Number.isInteger(n) && n > 0))];
        const delRestaurante = {
            idProducto: { in: ids },
            categoria: { idRestaurante: tenantId },
        };
        await this.prisma.$transaction([
            this.prisma.producto.updateMany({
                where: { idUnidad, categoria: { idRestaurante: tenantId } },
                data: { idUnidad: null },
            }),
            this.prisma.producto.updateMany({
                where: delRestaurante,
                data: { idUnidad },
            }),
        ]);
        return { id_unidad: idUnidad, id_productos: ids };
    }
};
exports.UnidadesService = UnidadesService;
exports.UnidadesService = UnidadesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnidadesService);
//# sourceMappingURL=unidades.service.js.map