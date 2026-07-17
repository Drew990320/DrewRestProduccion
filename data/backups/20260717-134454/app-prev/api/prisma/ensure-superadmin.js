import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Asegura el rol superadmin. Solo crea el usuario si SUPERADMIN_PASSWORD está
 * definido en el entorno (p. ej. Render). En on-prem la clave se define en la
 * app vía POST /auth/setup-superadmin — nunca hardcodeada.
 *
 * Uso: node prisma/ensure-superadmin.js
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const rol = await prisma.rol.upsert({
      where: { nombre: 'superadmin' },
      create: {
        nombre: 'superadmin',
        descripcion: 'Operación oculta del sistema',
      },
      update: {},
    });

    const email =
      process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ||
      'superadmin@drewrest.local';
    const password = process.env.SUPERADMIN_PASSWORD?.trim();
    const tenantId = 1;

    const existing = await prisma.usuario.findUnique({
      where: { idRestaurante_email: { idRestaurante: tenantId, email } },
    });
    if (existing) {
      console.log(`Superadmin ya existe: ${email}`);
      return;
    }

    if (!password) {
      console.log(
        'Superadmin no creado: define SUPERADMIN_PASSWORD en el entorno, o usa el login de la app (primer arranque) para elegir la contraseña.',
      );
      return;
    }

    await prisma.usuario.create({
      data: {
        idRestaurante: tenantId,
        idRol: rol.idRol,
        nombre: 'Superadmin',
        apellido: '',
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        passwordCambiadoEn: new Date(),
        activo: true,
      },
    });
    console.log(`Superadmin creado: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
