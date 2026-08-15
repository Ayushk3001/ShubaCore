import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CustomersClient } from "@/components/customers/CustomersClient";

export default async function CustomersPage() {
  await requireUser();

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true, leads: true },
      },
    },
  });

  return <CustomersClient customers={customers} />;
}
