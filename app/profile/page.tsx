"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Sidebar from "@/components/sidebar";
import {
  Play,
  Coins,
  Gamepad2,
  Trophy,
} from "lucide-react";

function getStats(user: User | null) {
  const meta = user?.user_metadata ?? {};
  const coins = meta.coins ?? 0;
  const gamesPlayed = meta.games_played ?? 0;
  const highestScore = meta.highest_score ?? 0;

  return [
    { label: "Coins", value: coins.toLocaleString(), icon: Coins, iconColor: "text-yellow-500" },
    { label: "Games Played", value: gamesPlayed.toLocaleString(), icon: Gamepad2, iconColor: "text-blue-500" },
    { label: "Highest Score", value: highestScore.toLocaleString(), icon: Trophy, iconColor: "text-orange-500" },
  ];
}

const MATCHES = [
  { place: "#1", placeColor: "#FFD700", placeBg: "#FFD70020", score: "48,291 points", duration: "12m 34s", time: "2h ago" },
  { place: "#2", placeColor: "#C0C0C0", placeBg: "#C0C0C020", score: "31,820 points", duration: "8m 47s", time: "5h ago" },
  { place: "#3", placeColor: "#CD7F32", placeBg: "#CD7F3220", score: "25,108 points", duration: "6m 12s", time: "Yesterday" },
  { place: "#7", placeColor: "#71717A", placeBg: "#1C1C1F", score: "14,320 points", duration: "4m 55s", time: "Yesterday" },
  { place: "#5", placeColor: "#71717A", placeBg: "#1C1C1F", score: "18,655 points", duration: "9m 03s", time: "2 days ago" },
];

const FRIENDS = [
  { name: "CellKing", status: "In game", online: true, color: "bg-red-500", action: "Join" },
  { name: "BlobHunter", status: "In game", online: true, color: "bg-purple-500", action: "Join" },
  { name: "Splitmaster", status: "Online", online: true, color: "bg-cyan-500", action: "Invite" },
  { name: "PetriFear", status: "In lobby", online: true, color: "bg-orange-500", action: "Invite" },
  { name: "GlowWorm", status: "Offline", online: false, color: "bg-yellow-500" },
  { name: "Consume99", status: "Last seen 3h ago", online: false, color: "bg-green-500" },
  { name: "TinyBlob", status: "Last seen 1d ago", online: false, color: "bg-pink-500" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);
      setLoading(false);
    });
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Player";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar user={user!} activePage="Dashboard" />

      <main className="flex flex-1 flex-col gap-8 overflow-y-auto px-10 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-[family-name:var(--font-geist-sans)] text-[28px] font-semibold tracking-tight text-foreground" style={{ letterSpacing: "-1px" }}>
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">Ready to dominate the petri dish?</p>
          </div>
          <button
            onClick={() => router.push("/start")}
            className="flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            Play Now
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {getStats(user).map((stat) => (
            <div key={stat.label} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-[18px] w-[18px] ${stat.iconColor}`} />
              </div>
              <span className="font-[family-name:var(--font-geist-sans)] text-[32px] font-semibold text-foreground" style={{ letterSpacing: "-1px" }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Recent Matches */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-[family-name:var(--font-geist-sans)] text-base font-semibold text-foreground">Recent Matches</span>
              <span className="text-xs font-medium text-muted-foreground">View all</span>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              {MATCHES.map((match, i) => (
                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${i < MATCHES.length - 1 ? "border-b border-border" : ""}`}>
                  <div
                    className="flex h-[22px] w-7 items-center justify-center rounded text-[11px] font-semibold"
                    style={{ color: match.placeColor, backgroundColor: match.placeBg, fontFamily: "IBM Plex Mono, monospace" }}
                  >
                    {match.place}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-foreground">{match.score}</span>
                    <span className="text-[11px] text-muted-foreground">{match.duration}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{match.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Friends */}
          <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-[family-name:var(--font-geist-sans)] text-base font-semibold text-foreground">Friends</span>
              <div className="flex items-center gap-1.5">
                <div className="h-[7px] w-[7px] rounded-full bg-green-500" />
                <span className="text-xs text-green-500">4 online</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              {FRIENDS.map((friend, i) => (
                <div key={friend.name} className={`flex items-center gap-3 px-5 py-2.5 ${i < FRIENDS.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="relative h-8 w-8 shrink-0">
                    <div className={`h-8 w-8 rounded-full ${friend.color} ${!friend.online ? "opacity-40" : ""}`} />
                    {friend.online && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className={`truncate text-[13px] font-medium ${friend.online ? "text-foreground" : "text-muted-foreground"}`}>
                      {friend.name}
                    </span>
                    <span className={`text-[11px] ${friend.online ? "text-green-500" : "text-white/20"}`}>
                      {friend.status}
                    </span>
                  </div>
                  {friend.action && (
                    <button className="flex h-7 items-center rounded-md bg-secondary px-3 text-[11px] font-medium text-foreground">
                      {friend.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
