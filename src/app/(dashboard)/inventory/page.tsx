import { requireUser } from "@/lib/auth";
import { Package, Layers, Truck, ShieldAlert } from "lucide-react";

export default async function InventoryPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Inventory & Suppliers (Phase 2)</h1>
        <p className="mt-1 text-sm text-[#6b746c]">
          Stock levels, purchase orders, and supplier management.
        </p>
      </div>

      <div className="rounded-xl border border-[#d8ded2] bg-white p-8 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#3f563f]">
          <Package className="size-7" />
        </div>
        <h2 className="text-lg font-semibold text-[#20231f]">Phase 2 Planned Module</h2>
        <p className="text-sm text-[#5f685e] leading-relaxed">
          MVP operational workflow relies on order line items and direct expense tracking. Physical inventory SKU tracking, stock movements, and purchase order management will be enabled in Phase 2.
        </p>
        <div className="pt-2 grid grid-cols-3 gap-3 text-left">
          <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8]">
            <p className="text-xs font-semibold text-[#3f563f] flex items-center gap-1">
              <Layers className="size-3.5" /> Stock Tracking
            </p>
            <p className="text-[11px] text-[#6b746c] mt-1">Automatic deduction per order</p>
          </div>
          <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8]">
            <p className="text-xs font-semibold text-[#3f563f] flex items-center gap-1">
              <Truck className="size-3.5" /> Suppliers
            </p>
            <p className="text-[11px] text-[#6b746c] mt-1">Vendor directory & purchase bills</p>
          </div>
          <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8]">
            <p className="text-xs font-semibold text-[#3f563f] flex items-center gap-1">
              <ShieldAlert className="size-3.5" /> Low Stock Alerts
            </p>
            <p className="text-[11px] text-[#6b746c] mt-1">Threshold reorder notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
}
