import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CalendarDays, MapPin, User, Clock, AlertTriangle } from "lucide-react";

export default async function CalendarPage() {
  await requireUser();

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { deliveryDate: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      assignedPartner: { select: { name: true } },
    },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Production & Delivery Timeline</h1>
        <p className="mt-1 text-sm text-[#6b746c]">
          Upcoming event and delivery deadlines for active orders.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-[#6b746c] text-sm">
            No active order deadlines scheduled.
          </div>
        ) : (
          <div className="divide-y divide-[#edf1e8]">
            {orders.map((order) => {
              const isOverdue = order.deliveryDate && new Date(order.deliveryDate) < now;
              return (
                <div key={order.id} className="p-5 hover:bg-[#fbfcf9] transition flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex size-12 items-center justify-center rounded-xl font-bold ${
                        isOverdue
                          ? "bg-rose-100 text-rose-800"
                          : "bg-[#edf1e8] text-[#3f563f]"
                      }`}
                    >
                      <CalendarDays className="size-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-[#3f563f]">
                          {order.orderNumber}
                        </span>
                        <span className="rounded-md bg-[#edf1e8] px-2 py-0.5 text-xs font-semibold text-[#263326]">
                          {order.status}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                            <AlertTriangle className="size-3" /> OVERDUE
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-[#20231f] mt-1">
                        {order.customer.name} ({order.customer.phone})
                      </p>

                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#6b746c]">
                        {order.deliveryDate && (
                          <span className="flex items-center gap-1 font-medium text-[#20231f]">
                            <Clock className="size-3.5 text-[#8a948b]" /> Delivery:{" "}
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </span>
                        )}
                        {order.eventDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3.5 text-[#8a948b]" /> Event:{" "}
                            {new Date(order.eventDate).toLocaleDateString()}
                          </span>
                        )}
                        {order.assignedPartner && (
                          <span className="flex items-center gap-1">
                            <User className="size-3.5 text-[#8a948b]" /> Partner:{" "}
                            {order.assignedPartner.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-[#263326]">
                      ₹{Number(order.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
