"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Dashboard,
  ShoppingCart,
  Map,
  Notification,
  UserMultiple,
  CategoryNewEach,
  Security,
  Analytics,
} from "@carbon/icons-react";

const importerNav = [
  { href: "/dashboard", label: "Dashboard", icon: Dashboard },
  { href: "/food-security", label: "Food Security", icon: Security },
  { href: "/analytics", label: "Analytics", icon: Analytics },
  { href: "/orders", label: "Import Orders", icon: ShoppingCart },
  { href: "/tracking", label: "Vessel Tracking", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Notification },
];

const regulatorNav = [
  { href: "/dashboard", label: "Control Tower", icon: Dashboard },
  { href: "/food-security", label: "Food Security", icon: Security },
  { href: "/analytics", label: "Analytics", icon: Analytics },
  { href: "/orders", label: "All Orders", icon: ShoppingCart },
  { href: "/tracking", label: "Vessel Tracking", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Notification },
];

const adminNav = [
  { href: "/dashboard", label: "Control Tower", icon: Dashboard },
  { href: "/food-security", label: "Food Security", icon: Security },
  { href: "/analytics", label: "Analytics", icon: Analytics },
  { href: "/orders", label: "All Orders", icon: ShoppingCart },
  { href: "/tracking", label: "Vessel Tracking", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Notification },
  { href: "/admin/users", label: "Users", icon: UserMultiple },
  { href: "/admin/commodities", label: "Commodities", icon: CategoryNewEach },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const navItems =
    role === "ADMIN" ? adminNav : role === "REGULATOR" ? regulatorNav : importerNav;

  return (
    <aside className="fixed left-0 top-12 bottom-0 w-64 bg-white border-r border-[#e0e0e0] z-10 overflow-y-auto">
      <div className="px-4 py-6">
        <div className="mb-6 px-3">
          <p className="text-xs font-medium text-[#8d8d8d] uppercase tracking-wider">
            Navigation
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#e8e8e8] text-[#161616]"
                    : "text-[#525252] hover:bg-[#f4f4f4] hover:text-[#161616]"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
