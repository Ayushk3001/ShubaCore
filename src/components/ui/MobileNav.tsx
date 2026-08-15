"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Contact,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  WalletCards,
  X,
} from "lucide-react";

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

export function MobileNav({ user }: { user: { name: string; role: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top Header Bar for Mobile & Desktop */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#d8ded2] bg-white/95 px-4 backdrop-blur lg:px-6">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Toggle Button on Mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-[#4e584f] hover:bg-[#edf1e8] lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-md bg-[#263326] text-white">
              <WalletCards className="size-4" />
            </div>
            <span className="text-sm font-bold text-[#20231f]">Return Gift</span>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-[#20231f]">{user.name}</p>
            <p className="text-xs text-[#6b746c]">{user.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right lg:hidden">
            <p className="text-xs font-semibold text-[#20231f]">{user.name}</p>
            <p className="text-[10px] text-[#6b746c]">{user.role}</p>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Mobile Slide-Over Menu Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative flex w-4/5 max-w-xs flex-col bg-white p-5 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="mb-6 flex items-center justify-between border-b border-[#edf1e8] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#263326] text-white">
                  <WalletCards className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#20231f]">Return Gift</p>
                  <p className="text-xs text-[#6b746c]">Internal Manager</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#263326] text-white font-semibold shadow-sm"
                        : "text-[#4e584f] hover:bg-[#edf1e8] hover:text-[#20231f]"
                    }`}
                  >
                    <Icon className="size-5" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
