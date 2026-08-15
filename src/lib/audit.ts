import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entityType,
        entityId,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
