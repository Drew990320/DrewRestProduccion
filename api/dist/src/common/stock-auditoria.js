"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exigirPasswordAdmin = exigirPasswordAdmin;
exports.registrarAuditoriaStock = registrarAuditoriaStock;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
async function exigirPasswordAdmin(db, actor, password, accion) {
    if (!actor)
        throw new common_1.ForbiddenException('Sesión no válida');
    const rol = actor.rol?.nombre;
    if (rol !== 'admin' && rol !== 'superadmin') {
        throw new common_1.ForbiddenException(`Solo el administrador puede ${accion}`);
    }
    const clave = password?.trim();
    if (!clave) {
        throw new common_1.BadRequestException(`Para ${accion} el administrador debe confirmar su contraseña`);
    }
    const row = await db.usuario.findUnique({
        where: { idUsuario: actor.idUsuario },
        select: { activo: true, passwordHash: true, nombre: true, apellido: true },
    });
    if (!row?.activo || !(await bcrypt.compare(clave, row.passwordHash))) {
        throw new common_1.ForbiddenException('Contraseña de administrador incorrecta');
    }
    return `${row.nombre} ${row.apellido ?? ''}`.trim();
}
async function registrarAuditoriaStock(db, data) {
    await db.auditoriaStock.create({
        data: {
            idRestaurante: data.idRestaurante,
            accion: data.accion,
            origen: data.origen,
            idReferencia: data.idReferencia ?? null,
            nombre: data.nombre.slice(0, 200),
            stockAnterior: data.stockAnterior ?? null,
            stockNuevo: data.stockNuevo ?? null,
            motivo: data.motivo?.trim().slice(0, 255) || null,
            idUsuario: data.idUsuario,
            nombreUsuario: data.nombreUsuario.slice(0, 120),
        },
    });
}
//# sourceMappingURL=stock-auditoria.js.map