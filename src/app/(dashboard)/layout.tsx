import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Contact,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth";
import { MobileNav } from "@/components/ui/MobileNav";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Contact },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/finance", label: "Finance", icon: Receipt },
  { href: "/partners", label: "Partners", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#20231f]">
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#d8ded2] bg-white px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-md bg-[#263326] text-white">
            <WalletCards className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">Return Gift</p>
            <p className="text-xs text-[#6b746c]">Internal manager</p>
          </div>
        </div>
        <nav className="grid gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#4e584f] transition hover:bg-[#edf1e8] hover:text-[#20231f]"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <MobileNav user={{ name: user.name, role: user.role }} />
        <main className="px-3 py-4 sm:px-5 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
