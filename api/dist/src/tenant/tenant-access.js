"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTenantAccessForUser = assertTenantAccessForUser;
const common_1 = require("@nestjs/common");
const roles_1 = require("@drewrest/shared-domain/roles");
const restaurante_acceso_cache_1 = require("./restaurante-acceso-cache");
async function assertTenantAccessForUser(prisma, user) {
    if (user.rol.nombre === roles_1.ROL_SUPERADMIN)
        return;
    let rest = (0, restaurante_acceso_cache_1.getCachedRestauranteAcceso)(user.idRestaurante);
    if (!rest) {
        const row = await prisma.restaurante.findUnique({
            where: { idRestaurante: user.idRestaurante },
            select: { activo: true, accesoHasta: true },
        });
        if (!row) {
            throw new common_1.UnauthorizedException('Restaurante no encontrado');
        }
        rest = { activo: row.activo, accesoHasta: row.accesoHasta };
        (0, restaurante_acceso_cache_1.setCachedRestauranteAcceso)(user.idRestaurante, rest);
    }
    if (!rest.activo) {
        throw new common_1.UnauthorizedException('El acceso a este restaurante está desactivado. Contacta al soporte.');
    }
    if (rest.accesoHasta && rest.accesoHasta.getTime() < Date.now()) {
        throw new common_1.UnauthorizedException('El acceso a este restaurante ha expirado. Contacta al soporte.');
    }
}
//# sourceMappingURL=tenant-access.js.map