"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/backButton";

const Game = dynamic(() => import("../game/Game"), { ssr: false });

type Screen = "menu" | "playing" | "dead";

export default function GamePage() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playerName, setPlayerName] = useState("");
  const [lastScore, setLastScore] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [equippedSkin, setEquippedSkin] = useState<{ colorFrom: string; colorTo: string; imgUrl?: string | null } | undefined>(undefined);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      userRef.current = user;
      if (user?.app_metadata?.is_super_admin === true) {
        setIsSuperAdmin(true);
      }
      if (user) {
        const { data } = await supabase
          .from("inventories")
          .select("skins(hex_from, hex_to, img_url)")
          .eq("user_id", user.id)
          .eq("equipped", true)
          .single();
        if (data?.skins) {
          const skin = data.skins as unknown as { hex_from: string; hex_to: string; img_url: string | null };
          setEquippedSkin({ colorFrom: skin.hex_from, colorTo: skin.hex_to, imgUrl: skin.img_url });
        }
      }
    });
  }, []);

  const stableSkin = useMemo(() => equippedSkin, [equippedSkin?.colorFrom, equippedSkin?.colorTo, equippedSkin?.imgUrl]);

  const handlePlay = async () => {
    if (!playerName.trim()) {
      setPlayerName("Player");
    }
    setScreen("playing");

    const user = userRef.current;
    if (user) {
      const supabase = createClient();
      const currentPlayed = user.user_metadata?.games_played ?? 0;
      await supabase.auth.updateUser({
        data: { games_played: currentPlayed + 1 },
      });
    }
  };

  const handleDeath = useCallback(async (score: number) => {
    setLastScore(score);
    setScreen("dead");

    const user = userRef.current;
    if (user) {
      const currentHighest = user.user_metadata?.highest_score ?? 0;
      if (score > currentHighest) {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { highest_score: score },
        });
      }
    }
  }, []);

  if (screen === "playing") {
    return <Game playerName={playerName || "Player"} onDeath={handleDeath} isSuperAdmin={isSuperAdmin} isLoggedIn={!!userRef.current} skin={stableSkin} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-emerald-950/20">
      <BackButton />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute left-1/3 top-10 h-40 w-40 rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-sm border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="items-center space-y-4 pb-2">
          <h1 className="text-5xl font-bold tracking-tight">
            Plasm
          </h1>

          {screen === "dead" && (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3">
              <p className="text-lg font-semibold text-destructive">
                You were eaten!
              </p>
              <p className="text-sm text-muted-foreground">
                Final score:{" "}
                <span className="font-mono font-bold text-foreground">
                  {lastScore}
                </span>
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            maxLength={20}
            autoFocus
            className="h-12 text-base"
          />

          <Button
            onClick={handlePlay}
            size="lg"
            className="w-full bg-emerald-600 text-base font-semibold hover:bg-emerald-500"
          >
            Play
          </Button>
        </CardContent>

        <CardFooter className="flex-col gap-3 pt-2">
          <div className="flex gap-2">
            <Badge variant="secondary">
              <span className="text-muted-foreground">Mouse</span>&nbsp;Move
            </Badge>
            <Badge variant="secondary">
              <span className="text-muted-foreground">Space</span>&nbsp;Split
            </Badge>
            <Badge variant="secondary">
              <span className="text-muted-foreground">W</span>&nbsp;Eject
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
