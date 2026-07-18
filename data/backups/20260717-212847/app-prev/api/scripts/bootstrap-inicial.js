const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function ensureRoles() {
  await prisma.rol.upsert({
    where: { nombre: "mesero" },
    update: {},
    create: { nombre: "mesero", descripcion: "Toma pedidos y factura" },
  });
  await prisma.rol.upsert({
    where: { nombre: "chef" },
    update: {},
    create: { nombre: "chef", descripcion: "Vista cocina" },
  });
  await prisma.rol.upsert({
    where: { nombre: "admin" },
    update: {},
    create: { nombre: "admin", descripcion: "Administracion" },
  });
  await prisma.rol.upsert({
    where: { nombre: "superadmin" },
    update: {},
    create: { nombre: "superadmin", descripcion: "Operacion oculta del sistema" },
  });
}

async function ensureUsers() {
  await prisma.restaurante.upsert({
    where: { idRestaurante: 1 },
    create: { idRestaurante: 1, slug: "principal", nombre: "Restaurante" },
    update: {},
  });

  const rolMesero = await prisma.rol.findUniqueOrThrow({ where: { nombre: "mesero" } });
  const rolChef = await prisma.rol.findUniqueOrThrow({ where: { nombre: "chef" } });
  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: "admin" } });
  const rolSuperadmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: "superadmin" } });

  const defaults = [
    {
      idRol: rolMesero.idRol,
      nombre: "Mesero",
      apellido: "Demo",
      email: "mesero@drewrest.local",
      password: "mesero123",
    },
    {
      idRol: rolChef.idRol,
      nombre: "Chef",
      apellido: "Demo",
      email: "chef@drewrest.local",
      password: "chef123",
    },
    {
      idRol: rolAdmin.idRol,
      nombre: "Admin",
      apellido: "Demo",
      email: "admin@drewrest.local",
      password: "admin123",
    },
    // Superadmin NO se crea aquí: la contraseña se define en la app
    // (POST /auth/setup-superadmin) para que no quede en el código.
  ];

  const created = [];

  for (const u of defaults) {
    const exists = await prisma.usuario.findUnique({
      where: {
        idRestaurante_email: { idRestaurante: 1, email: u.email },
      },
    });
    if (exists) continue;
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.usuario.create({
      data: {
        idRestaurante: 1,
        idRol: u.idRol,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        passwordHash,
        activo: true,
      },
    });
    created.push({ email: u.email, password: u.password });
  }

  const superadminCount = await prisma.usuario.count({
    where: { idRol: rolSuperadmin.idRol },
  });
  if (superadminCount === 0) {
    console.log(
      "[bootstrap] Superadmin pendiente: define la contraseña en el login (primer arranque).",
    );
  }

  return created;
}

async function ensureMesas() {
  const idRestaurante = 1;
  for (let n = 1; n <= 15; n++) {
    await prisma.mesa.upsert({
      where: {
        idRestaurante_numero: { idRestaurante, numero: n },
      },
      update: {},
      create: {
        idRestaurante,
        numero: n,
        capacidad: 4,
        estado: "libre",
      },
    });
  }
  for (const numero of [98, 99]) {
    await prisma.mesa.upsert({
      where: {
        idRestaurante_numero: { idRestaurante, numero },
      },
      update: {},
      create: {
        idRestaurante,
        numero,
        capacidad: 1,
        estado: "libre",
      },
    });
  }
}

async function main() {
  await ensureRoles();
  const createdUsers = await ensureUsers();
  await ensureMesas();

  console.log("[bootstrap] Roles, usuarios y mesas base verificados.");
  if (createdUsers.length > 0) {
    console.log("[bootstrap] Se crearon usuarios iniciales:");
    for (const u of createdUsers) {
      console.log(`  - ${u.email} / ${u.password}`);
    }
  } else {
    console.log("[bootstrap] Usuarios iniciales ya existian (no se modificaron).");
  }
}

main()
  .catch((e) => {
    console.error("[bootstrap] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
