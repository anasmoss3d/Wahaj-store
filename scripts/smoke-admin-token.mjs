import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

const prisma = new PrismaClient();

const admin = await prisma.adminUser.findFirst({
  include: { role: true }
});
if (!admin) {
  console.error("NO ADMIN FOUND");
  process.exit(1);
}

const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
await prisma.adminSession.create({
  data: {
    tokenHash,
    adminUserId: admin.id,
    expiresAt: new Date(Date.now() + 86400_000)
  }
});
// Output format: TOKEN|ADMINID|ROLENAME
console.log([token, admin.id, admin.role.name].join("|"));
await prisma.$disconnect();
