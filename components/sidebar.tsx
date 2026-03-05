"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Palette,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/profile" },
  { icon: Palette, label: "Skins", href: "/skins" },
  { icon: Users, label: "Friends", href: "/friends" },
];

const ACCOUNT_ITEMS = [
  { icon: Settings, label: "Settings" },
  { icon: LogOut, label: "Sign Out", action: "signout" as const },
];

interface SidebarProps {
  user: User;
  activePage: string;
  skinVersion?: number;
}

export default function Sidebar({ user, activePage, skinVersion }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [skinColors, setSkinColors] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    supabase
      .from("inventories")
      .select("skins(hex_from, hex_to)")
      .eq("user_id", user.id)
      .eq("equipped", true)
      .single()
      .then(({ data }) => {
        if (data?.skins) {
          const skin = data.skins as unknown as { hex_from: string; hex_to: string };
          setSkinColors({ from: skin.hex_from, to: skin.hex_to });
        }
      });
  }, [user.id, supabase, skinVersion]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Player";

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="h-7 w-7 rounded-full bg-primary" />
        <span className="font-[family-name:var(--font-geist-sans)] text-xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-1px" }}>
          Plasm
        </span>
      </div>

      {/* Menu Section */}
      <div className="flex flex-col gap-1.5 pt-2">
        <span className="px-3 text-[10px] font-semibold tracking-[2px] text-muted-foreground">MENU</span>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === activePage;
            return (
              <button
                key={item.label}
                onClick={item.href ? () => router.push(item.href) : undefined}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Account Section */}
      <div className="flex flex-col gap-1.5 pt-4">
        <span className="px-3 text-[10px] font-semibold tracking-[2px] text-muted-foreground">ACCOUNT</span>
        <nav className="flex flex-col gap-0.5">
          {ACCOUNT_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={item.action === "signout" ? handleSignOut : undefined}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1" />

      {/* User Card */}
      <div className="flex items-center gap-2.5 rounded-md bg-secondary px-2 py-3">
        <div
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: skinColors
              ? `radial-gradient(circle, ${skinColors.from}, ${skinColors.to})`
              : undefined,
          }}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-semibold text-foreground">{displayName}</span>
          <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
        </div>
      </div>
    </aside>
  );
}
