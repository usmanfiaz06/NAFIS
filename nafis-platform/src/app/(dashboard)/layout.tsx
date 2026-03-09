"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f4f4]">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-[#0f62fe] rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-12">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
