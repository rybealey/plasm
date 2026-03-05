"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Sidebar from "@/components/sidebar";
import { Users } from "lucide-react";

export default function FriendsPage() {
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar user={user!} activePage="Friends" />

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-10 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="font-[family-name:var(--font-geist-sans)] text-xl font-semibold tracking-tight text-foreground" style={{ letterSpacing: "-0.5px" }}>
            Friends
          </h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            The friendship feature is coming soon. You&apos;ll be able to add friends, see when they&apos;re online, and play together.
          </p>
        </div>
      </main>
    </div>
  );
}
