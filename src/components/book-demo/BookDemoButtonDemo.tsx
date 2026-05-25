"use client";
import BookDemoButton from "./BookDemoButton";
import type { BookDemoVariant } from "./BookDemoButton";

const variants: BookDemoVariant[] = [
  "lime",
  "sky",
  "rose",
  "amber",
  "emerald",
  "violet",
  "orange",
  "magenta",
];

export default function BookDemoButtonDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {variants.map((v) => (
          <BookDemoButton key={v} variant={v} />
        ))}
      </div>
    </div>
  );
}
