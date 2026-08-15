import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  await requireUser();

  const [users, auditLogs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true } },
      },
    }),
  ]);

  return <SettingsClient users={users} auditLogs={auditLogs as any} />;
}
