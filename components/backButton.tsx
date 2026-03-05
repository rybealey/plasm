"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/profile")}
      className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-[#0A0A0B]/80 transition-colors hover:bg-[#0A0A0B]"
    >
      <ArrowLeft className="h-5 w-5 text-[#FAFAFA]" />
    </button>
  );
}
