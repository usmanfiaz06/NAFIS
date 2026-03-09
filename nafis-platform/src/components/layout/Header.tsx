"use client";

import { useSession, signOut } from "next-auth/react";
import { Notification, UserAvatar, Logout } from "@carbon/icons-react";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const roleBadge: Record<string, { label: string; color: string }> = {
    IMPORTER: { label: "Importer", color: "bg-[#edf5ff] text-[#0043ce]" },
    REGULATOR: { label: "Regulator", color: "bg-[#defbe6] text-[#198038]" },
    ADMIN: { label: "Admin", color: "bg-[#f4f4f4] text-[#525252]" },
  };

  const badge = roleBadge[user?.role] || roleBadge.IMPORTER;

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-[#161616] flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#0f62fe] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="text-white text-sm font-semibold tracking-wide">
            NAFIS
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {["Home", "Orders", "Tracking", "Alerts"].map((item) => (
            <span
              key={item}
              className="text-[#c6c6c6] text-xs px-3 py-1 rounded hover:text-white hover:bg-[#393939] transition-colors cursor-pointer"
            >
              {item}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button className="text-[#c6c6c6] hover:text-white p-1.5 rounded hover:bg-[#393939] transition-colors">
          <Notification size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
          <div className="flex items-center gap-1.5">
            <UserAvatar size={18} className="text-[#c6c6c6]" />
            <span className="text-[#c6c6c6] text-xs">{user?.name || "User"}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[#c6c6c6] hover:text-white p-1.5 rounded hover:bg-[#393939] transition-colors"
            title="Sign out"
          >
            <Logout size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
