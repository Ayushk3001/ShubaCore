import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
  tx,
}: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
}) {
  try {
    const client = tx || prisma;
    await client.auditLog.create({
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
