"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GameState, Camera, Player, PlayerSkin, GAME_CONFIG } from "./types";
import { createInitialState, tick, splitPlayer, ejectMass } from "./engine";
import { render, getCamera } from "./renderer";
import Leaderboard from "./Leaderboard";
import BackButton from "@/components/back-button";
import ChatWindow from "@/components/chat-window";

interface GameProps {
  playerName: string;
  onDeath: (score: number) => void;
  isSuperAdmin?: boolean;
  skin?: PlayerSkin;
}

export default function Game({ playerName, onDeath, isSuperAdmin, skin }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const cameraRef = useRef<Camera>({
    x: GAME_CONFIG.WORLD_SIZE / 2,
    y: GAME_CONFIG.WORLD_SIZE / 2,
    zoom: 1,
  });
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const [dead, setDead] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{ players: Player[]; humanId: string }>({ players: [], humanId: "" });

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    handleResize();
    window.addEventListener("resize", handleResize);

    stateRef.current = createInitialState(playerName, skin);

    const handleMouseMove = (e: MouseEvent) => {
      const camera = cameraRef.current;
      // convert screen position to world position
      mouseRef.current = {
        x: (e.clientX - canvas.width / 2) / camera.zoom + camera.x,
        y: (e.clientY - canvas.height / 2) / camera.zoom + camera.y,
      };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle game keys when typing in chat
      if (document.activeElement?.tagName === "INPUT") return;

      const state = stateRef.current;
      if (!state) return;
      const human = state.players[0];
      if (!human || human.cells.length === 0) return;

      if (e.code === "Space") {
        e.preventDefault();
        splitPlayer(human, state.tickCount);
      } else if (e.code === "KeyW") {
        const ejected = ejectMass(human);
        state.ejectedMass.push(...ejected);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    let lastTick = performance.now();
    const TICK_RATE = 1000 / 60;

    function gameLoop(now: number) {
      const state = stateRef.current;
      if (!state || !ctx || !canvas) return;

      const delta = now - lastTick;
      if (delta >= TICK_RATE) {
        lastTick = now - (delta % TICK_RATE);
        tick(state, mouseRef.current);

        // check if human died
        const human = state.players[0];
        if (human && human.cells.length === 0 && !dead) {
          setDead(true);
          onDeath(human.score);
          return;
        }
      }

      const human = state.players[0];
      if (human) {
        cameraRef.current = getCamera(human, canvas);
      }

      render(ctx, canvas, state, cameraRef.current);

      // update leaderboard every 30 frames (~0.5s)
      if (state.tickCount % 30 === 0) {
        setLeaderboardData({
          players: state.players.map((p) => ({ ...p })),
          humanId: state.players[0]?.id ?? "",
        });
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playerName, handleResize, onDeath, dead, skin]);

  return (
    <div className="relative h-screen w-screen">
      <BackButton />
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100vw",
          height: "100vh",
          cursor: "default",
        }}
      />
      <Leaderboard
        players={leaderboardData.players}
        humanPlayerId={leaderboardData.humanId}
        isHumanSuperAdmin={isSuperAdmin}
      />
      <ChatWindow playerName={playerName} />
    </div>
  );
}
