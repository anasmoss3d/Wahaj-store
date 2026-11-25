import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const PERMISSIONS = [
  ["dashboard:read", "View admin dashboard"],
  ["products:manage", "Manage products, colors, categories, add-ons, images, and reviews"],
  ["orders:manage", "Manage orders and order statuses"],
  ["marketing:manage", "Manage coupons and promotions"],
  ["settings:manage", "Manage store settings and shipping rates"],
  ["admins:manage", "Manage admin users and roles"],
  ["audit:read", "Read audit log"]
] as const;

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : undefined;
}

async function main() {
  loadDotEnv();
  const prisma = new PrismaClient();

  const email = (readFlag("email") || process.env.ADMIN_EMAIL || "admin@wahaj.local").trim().toLowerCase();
  const rawPassword = readFlag("password") || process.env.ADMIN_PASSWORD;
  if (
    process.env.NODE_ENV === "production" &&
    (!rawPassword || rawPassword === "ChangeMe123!")
  ) {
    throw new Error("A non-default ADMIN_PASSWORD must be explicitly provided in production.");
  }
  const password = rawPassword || "ChangeMe123!";
  const name = (readFlag("name") || process.env.ADMIN_NAME || "Wahaj Admin").trim();

  if (!email.includes("@")) {
    throw new Error(`Invalid admin email: ${email}`);
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Admin password must be between 8 and 72 bytes.");
  }

  try {
    const existingCustomer = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true }
    });
    if (existingCustomer) {
      throw new Error(`Cannot seed admin: customer account already uses ${email}`);
    }
    for (const [key, description] of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key },
        update: { description },
        create: { key, description }
      });
    }

    const superAdminRole = await prisma.role.upsert({
      where: { name: "Super Admin" },
      update: { description: "Full access" },
      create: { name: "Super Admin", description: "Full access" }
    });

    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const adminUser = await prisma.adminUser.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        roleId: superAdminRole.id,
        active: true
      },
      create: {
        email,
        name,
        passwordHash,
        roleId: superAdminRole.id,
        active: true
      },
      include: { role: true }
    });

    await prisma.adminSession.deleteMany({
      where: { adminUserId: adminUser.id }
    });

    console.log(
      `Admin account ready: ${adminUser.email} (name: "${adminUser.name}", role: ${adminUser.role.name}, active: ${adminUser.active})`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed admin account:", error);
  process.exit(1);
});
