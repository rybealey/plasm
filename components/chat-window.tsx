"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  name: string;
  text: string;
  color: string;
}

const PLAYER_COLORS = [
  "#3B82F6", "#EF4444", "#A855F7", "#22C55E", "#EC4899",
  "#F59E0B", "#06B6D4", "#F97316",
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}

const CHANNEL_NAME = "game-chat";

export default function ChatWindow({ playerName }: { playerName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [playerCount, setPlayerCount] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: playerName } },
    });

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => [...prev.slice(-99), payload as ChatMessage]);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPlayerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: playerName });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [playerName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !channelRef.current) return;

    const msg: ChatMessage = { name: playerName, text, color: nameToColor(playerName) };
    channelRef.current.send({ type: "broadcast", event: "message", payload: msg });
    setMessages((prev) => [...prev.slice(-99), msg]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex w-[300px] flex-col overflow-hidden rounded-lg border border-[#27272A80] bg-[#0A0A0BCC] backdrop-blur-sm" style={{ height: 360 }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A60] px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-white" />
          <span className="text-[13px] font-semibold text-white">Room Chat</span>
        </div>
        <span className="text-[11px] text-white/40">
          {playerCount} {playerCount === 1 ? "player" : "players"}
        </span>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-[11px] text-white/25">No messages yet</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex flex-wrap items-start gap-1.5">
              <span className="text-xs font-semibold" style={{ color: msg.color }}>{msg.name}:</span>
              <span className="text-xs text-white/80">{msg.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[#27272A60] px-3.5 py-2.5">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
            e.stopPropagation();
          }}
          placeholder="Type a message..."
          className="h-8 flex-1 rounded-md bg-[#1C1C1F] px-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary"
        >
          <Send className="h-3.5 w-3.5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}
