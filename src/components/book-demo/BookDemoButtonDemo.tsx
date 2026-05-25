"use client";
import { useState } from "react";
import BookDemoButton from "./BookDemoButton";
import type { BookDemoVariant } from "./BookDemoButton";
import { cn } from "@/lib/utils";

const variants: { name: BookDemoVariant; color: string }[] = [
  { name: "lime", color: "#c5ea2c" },
  { name: "sky", color: "#6bc8f5" },
  { name: "rose", color: "#f590a5" },
  { name: "amber", color: "#f5a82e" },
  { name: "emerald", color: "#5fd49a" },
  { name: "violet", color: "#a07bf5" },
  { name: "orange", color: "#f57a3a" },
  { name: "magenta", color: "#e060c5" },
];

type Props = {
  compact?: boolean;
};

export default function BookDemoButtonDemo({ compact = false }: Props) {
  const [variant, setVariant] = useState<BookDemoVariant>("lime");

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center",
        compact ? "gap-4 py-4 px-3" : "gap-14 py-12 px-6"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center",
          compact ? "h-11 w-36" : "h-[88px] w-[288px]"
        )}
      >
        <div className={compact ? "" : "origin-center scale-[2]"}>
          <BookDemoButton variant={variant} />
        </div>
      </div>

      <div className={cn("flex flex-col items-center", compact ? "gap-1.5" : "gap-3")}>
        {!compact && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-base-400 font-medium">
            Color
          </span>
        )}
        <div
          className={cn(
            "flex items-center rounded-full border border-base-100 bg-white/60 backdrop-blur shadow-sm",
            compact ? "gap-1.5 px-2 py-1.5" : "gap-2.5 px-3 py-2"
          )}
        >
          {variants.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => setVariant(v.name)}
              aria-label={`Switch to ${v.name} color`}
              aria-pressed={variant === v.name}
              className={cn(
                "rounded-full outline-none ring-offset-2 ring-offset-white transition-all duration-200 cursor-pointer",
                compact ? "size-3.5" : "size-6",
                variant === v.name
                  ? "ring-2 ring-base-900 scale-110"
                  : "ring-1 ring-base-200/80 hover:scale-110 hover:ring-base-400"
              )}
              style={{ backgroundColor: v.color }}
            />
          ))}
        </div>
        {!compact && (
          <span className="text-xs text-base-500 capitalize font-medium tracking-tight">
            {variant}
          </span>
        )}
      </div>
    </div>
  );
}
