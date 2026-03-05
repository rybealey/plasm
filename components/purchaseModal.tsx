"use client";

import { Coins, X } from "lucide-react";

interface Skin {
  id: string;
  name: string;
  hex_from: string;
  hex_to: string;
  price: number;
}

interface PurchaseModalProps {
  skin: Skin;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PurchaseModal({ skin, balance, onConfirm, onCancel }: PurchaseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal Card */}
      <div
        className="relative flex w-[400px] flex-col gap-5 rounded-xl border border-[#27272A] bg-[#111113] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-semibold text-[#FAFAFA]"
            style={{ fontFamily: "var(--font-geist-sans)", letterSpacing: "-0.5px" }}
          >
            Confirm Purchase
          </h2>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1C1C1F] transition-colors hover:bg-[#27272A]"
          >
            <X className="h-4 w-4 text-[#71717A]" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#27272A]" />

        {/* Skin Preview */}
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 shrink-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${skin.hex_from}, ${skin.hex_to})`,
            }}
          />
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-[#FAFAFA]">{skin.name}</span>
            <span className="text-[13px] text-[#71717A]">Gradient cell skin</span>
          </div>
        </div>

        {/* Price Row */}
        <div className="flex items-center justify-between rounded-md bg-[#1C1C1F] px-4 py-3">
          <span className="text-[13px] text-[#71717A]">Price</span>
          <div className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-[#EAB308]" />
            <span className="text-base font-bold text-[#FAFAFA]">
              {skin.price === 0 ? "Free" : skin.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Balance Note */}
        <div className="flex justify-center">
          <span className="text-xs text-[#71717A]">
            Your balance: {balance.toLocaleString()} coins
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#1C1C1F] text-sm font-medium text-[#FAFAFA] transition-colors hover:bg-[#27272A]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#BE161D] text-sm font-medium text-white transition-colors hover:bg-[#BE161D]/90"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
