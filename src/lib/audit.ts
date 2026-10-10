import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requestMetadata } from "@/lib/security";

export async function writeAuditLog(input: {
  adminUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const meta = await requestMetadata();
  await prisma.auditLog.create({
    data: {
      adminUserId: input.adminUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
      ip: meta.ip
    }
  });
}
