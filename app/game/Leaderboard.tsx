"use client";

import { Trophy, ShieldCheck } from "lucide-react";
import { Player } from "./types";

interface LeaderboardProps {
  players: Player[];
  humanPlayerId?: string;
  isHumanSuperAdmin?: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

export default function Leaderboard({ players, humanPlayerId, isHumanSuperAdmin }: LeaderboardProps) {
  const sorted = [...players]
    .filter((p) => p.cells.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const onlineCount = players.filter((p) => p.cells.length > 0).length;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 w-[240px] overflow-hidden rounded-lg border border-[#27272A80] bg-[#0A0A0BCC]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A60] px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-[#EAB308]" />
          <span className="text-[13px] font-semibold text-[#FFFFFFEE]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Leaderboard
          </span>
        </div>
        <span className="text-[11px] text-[#FFFFFF66]">
          {onlineCount} online
        </span>
      </div>

      {/* List */}
      <div className="flex flex-col py-1">
        {sorted.map((player, i) => {
          const rank = i + 1;
          const isHuman = player.id === humanPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-2.5 px-3.5 py-[7px] ${isHuman ? "bg-[#FFFFFF0A]" : ""}`}
            >
              {/* Rank */}
              <span
                className="text-[11px] font-medium"
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  color: RANK_COLORS[rank] || "#FFFFFF55",
                }}
              >
                {String(rank).padStart(2, "0")}
              </span>

              {/* Cell dot */}
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: player.color }}
              />

              {/* Name */}
              <div className="flex min-w-0 flex-1 items-center gap-[5px]">
                <span className="truncate text-xs font-medium text-[#FFFFFFDD]">
                  {player.name}
                </span>
                {isHuman && isHumanSuperAdmin && (
                  <ShieldCheck className="h-[13px] w-[13px] shrink-0 text-[#06B6D4]" />
                )}
              </div>

              {/* Score */}
              <span
                className="shrink-0 text-[11px] text-[#FFFFFF88]"
                style={{ fontFamily: "IBM Plex Mono, monospace" }}
              >
                {player.score.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
