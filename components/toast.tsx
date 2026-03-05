"use client";

import { useEffect } from "react";
import { CircleAlert, X } from "lucide-react";

interface ToastProps {
  title: string;
  description: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ title, description, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[360px] items-start gap-3 rounded-lg border border-[#27272A] bg-[#111113] px-4 py-3.5 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.2)]">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        <CircleAlert className="h-[18px] w-[18px] text-[#DC2626]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-[#FAFAFA]">{title}</span>
        <span className="text-[13px] text-[#71717A]">{description}</span>
      </div>
      <button
        onClick={onClose}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
      >
        <X className="h-3.5 w-3.5 text-[#71717A]" />
      </button>
    </div>
  );
}
