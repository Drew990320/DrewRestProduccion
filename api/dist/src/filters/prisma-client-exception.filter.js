"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaClientExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
let PrismaClientExceptionFilter = PrismaClientExceptionFilter_1 = class PrismaClientExceptionFilter {
    logger = new common_1.Logger(PrismaClientExceptionFilter_1.name);
    catch(exception, host) {
        const res = host.switchToHttp().getResponse();
        const req = host.switchToHttp().getRequest();
        const where = `${req?.method ?? '?'} ${req?.originalUrl ?? req?.url ?? '?'}`;
        if (exception.code === 'P2022') {
            this.logger.error(`Prisma P2022 (columna/tabla ausente) en ${where}: ${exception.message}`);
            res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                message: 'La base de datos no coincide con el esquema actual. Reinicia DrewRest.exe para aplicar migraciones, o en api ejecuta: npx prisma migrate deploy',
            });
            return;
        }
        this.logger.error(`Prisma ${exception.code} en ${where}: ${exception.message}`, exception.stack);
        if (exception.code === 'P2025') {
            res.status(common_1.HttpStatus.NOT_FOUND).json({
                statusCode: common_1.HttpStatus.NOT_FOUND,
                message: 'Registro no encontrado',
            });
            return;
        }
        if (exception.code === 'P2002') {
            res.status(common_1.HttpStatus.CONFLICT).json({
                statusCode: common_1.HttpStatus.CONFLICT,
                message: 'Ya existe un registro con esos datos',
            });
            return;
        }
        if (exception.code === 'P2034') {
            res.status(common_1.HttpStatus.CONFLICT).json({
                statusCode: common_1.HttpStatus.CONFLICT,
                message: 'Conflicto de concurrencia; reintenta la operación',
            });
            return;
        }
        if (exception.code === 'P2024' ||
            exception.code === 'P2028' ||
            exception.code === 'P1008') {
            res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                message: 'El servidor estaba ocupado. Espera un segundo e intenta cobrar de nuevo.',
            });
            return;
        }
        res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error de base de datos. Revisa los logs del servidor.',
        });
    }
};
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter;
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter = PrismaClientExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(library_1.PrismaClientKnownRequestError)
], PrismaClientExceptionFilter);
//# sourceMappingURL=prisma-client-exception.filter.js.map