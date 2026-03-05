"use client"

import { CircleAlert } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        error: <CircleAlert className="h-[18px] w-[18px] text-[#DC2626]" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-start gap-3 w-[360px] rounded-lg border border-[#27272A] bg-[#111113] px-4 py-3.5 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.2)]",
          title: "text-sm font-medium text-[#FAFAFA]",
          description: "text-[13px] text-[#71717A]",
          closeButton:
            "!static !transform-none !order-last shrink-0 flex h-5 w-5 items-center justify-center rounded !bg-transparent !border-0 !text-[#71717A] !shadow-none",
        },
      }}
      closeButton
      position="bottom-right"
      {...props}
    />
  )
}

export { Toaster }
