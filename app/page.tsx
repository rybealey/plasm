"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WandSparkles, Play, Coins, Users, MessageCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => {
    // Cannot read searchParams during SSR init, handled below
    return null;
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for auth error from callback redirect
  const authError = searchParams.get("error");
  if (authError === "auth_failed" && !error) {
    setError("Authentication failed. Please try again.");
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          coins: 0,
          games_played: 0,
          highest_score: 0,
        },
      },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage("Check your email for the magic link!");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0A0A0B]">
      {/* Left Panel — decorative game background */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={`v${i}`}
              className="absolute top-0 h-full w-px bg-[#1A1A1E]"
              style={{ left: `${((i + 1) * 60) / 720 * 100}%` }}
            />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={`h${i}`}
              className="absolute left-0 h-px w-full bg-[#1A1A1E]"
              style={{ top: `${((i + 1) * 60) / 900 * 100}%` }}
            />
          ))}
        </div>

        {/* Floating cells */}
        <div className="absolute left-[11%] top-[13%] h-[20%] w-[25%] rounded-full bg-blue-500/70 blur-sm" />
        <div className="absolute left-[44%] top-[31%] h-[29%] w-[36%] rounded-full bg-green-500/60 blur-sm" />
        <div className="absolute left-[69%] top-[11%] h-[11%] w-[14%] rounded-full bg-red-500/75 blur-sm" />
        <div className="absolute left-[6%] top-[56%] h-[16%] w-[19%] rounded-full bg-purple-500/65 blur-sm" />
        <div className="absolute left-[76%] top-[69%] h-[8%] w-[10%] rounded-full bg-yellow-500/80 blur-sm" />
        <div className="absolute left-[28%] top-[78%] h-[6%] w-[7%] rounded-full bg-cyan-500/75 blur-sm" />
        <div className="absolute left-[56%] top-[61%] h-[22%] w-[28%] rounded-full bg-orange-500/50 blur-sm" />
        <div className="absolute left-[39%] top-[7%] h-[4%] w-[5%] rounded-full bg-pink-500/80" />

        {/* Small food-like dots */}
        <div className="absolute left-[21%] top-[47%] h-6 w-6 rounded-full bg-green-500/90" />
        <div className="absolute left-[86%] top-[42%] h-[18px] w-[18px] rounded-full bg-cyan-500/85" />
        <div className="absolute left-[60%] top-[20%] h-[14px] w-[14px] rounded-full bg-yellow-500/90" />
        <div className="absolute left-[14%] top-[91%] h-5 w-5 rounded-full bg-red-500/85" />
        <div className="absolute left-[72%] top-[51%] h-4 w-4 rounded-full bg-blue-500/90" />

        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#08080ACC_100%)]" />

        {/* Brand text at bottom */}
        <div className="absolute bottom-12 left-12 z-10">
          <h1 className="font-[family-name:var(--font-geist-sans)] text-5xl font-bold tracking-[-2px] text-[#FAFAFA]">
            Plasm
          </h1>
          <p className="mt-4 text-lg tracking-wider text-[#71717A]">
            Consume. Grow. Dominate.
          </p>
        </div>
      </div>

      {/* Right Panel — login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="flex w-full max-w-[420px] flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h2 className="font-[family-name:var(--font-geist-sans)] text-[32px] font-semibold tracking-[-1px] text-[#FAFAFA]">
              Welcome back
            </h2>
            <p className="text-sm leading-relaxed text-[#71717A]">
              Enter your email to receive a magic link, or jump straight into the game as a guest.
            </p>
          </div>

          {/* Email form */}
          <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
            <label className="text-[13px] font-medium text-[#FAFAFA]">
              Email address
            </label>
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 border-[#27272A] bg-[#111113] text-sm text-[#FAFAFA] placeholder:text-[#71717A]"
            />
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="h-11 w-full gap-2 bg-[#BE161D] font-medium hover:bg-[#BE161D]/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="h-4 w-4" />
              )}
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
            {message && (
              <p className="text-sm text-green-400">{message}</p>
            )}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#27272A]" />
            <span className="text-[13px] text-[#71717A]">or</span>
            <div className="h-px flex-1 bg-[#27272A]" />
          </div>

          {/* Guest button */}
          <Button
            variant="outline"
            className="h-11 w-full gap-2 border-[#27272A] bg-transparent font-medium text-[#FAFAFA] hover:bg-[#1C1C1F]"
            onClick={() => router.push("/start")}
          >
            <Play className="h-4 w-4" />
            Play as Guest
          </Button>

          {/* Perks card */}
          <div className="rounded-lg border border-[#27272A] bg-[#111113] p-5">
            <h3 className="font-[family-name:var(--font-geist-sans)] text-base font-semibold text-[#FAFAFA]">
              Why create an account?
            </h3>

            <div className="mt-5 flex flex-col gap-5">
              <PerkRow
                icon={<Coins className="h-[18px] w-[18px] text-[#EAB308]" />}
                title="Earn Coins & Unlock Skins"
                description="Earn in-game coins during gameplay and spend them on limited edition skins to customize your cell."
              />
              <PerkRow
                icon={<Users className="h-[18px] w-[18px] text-[#3B82F6]" />}
                title="Create Sessions & Invite Friends"
                description="Create party sessions and invite friends to play alongside you and dominate the map together."
              />
              <PerkRow
                icon={<MessageCircle className="h-[18px] w-[18px] text-[#22C55E]" />}
                title="Chat with Players"
                description="Send messages to other registered players, coordinate strategies, and build your community."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerkRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1C1C1F]">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[#FAFAFA]">{title}</span>
        <span className="text-xs leading-relaxed text-[#71717A]">{description}</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
