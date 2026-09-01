import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  count: number;
  accent: string;
  empty: string;
  index: number;
  children: ReactNode;
};

export function Column({ id, label, count, accent, empty, index, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });

  return (
    <section
      className="flex w-[19rem] shrink-0 flex-col gap-3"
      style={{ ["--tint" as string]: accent }}
    >
      <header className="px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-[0.95rem] font-semibold tracking-tight text-foreground">
            {label}
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums"
            style={{
              color: `color-mix(in oklab, ${accent} 72%, var(--foreground))`,
              backgroundColor: `color-mix(in oklab, ${accent} 16%, transparent)`,
            }}
          >
            {count}
          </span>
        </div>
        <div
          className="mt-2 h-[3px] w-full rounded-full"
          style={{
            backgroundImage: `linear-gradient(to right, ${accent}, color-mix(in oklab, ${accent} 22%, transparent))`,
            opacity: 0.85,
          }}
        />
        <p className="mt-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground/70">
          Stage {index + 1}
        </p>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[8rem] flex-1 flex-col gap-2.5 rounded-2xl p-2 transition-colors duration-200",
          isOver ? "ring-1" : "ring-0",
        )}
        style={{
          backgroundColor: isOver
            ? `color-mix(in oklab, ${accent} 9%, transparent)`
            : "color-mix(in oklab, var(--foreground) 3%, transparent)",
          ...(isOver ? { boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 35%, transparent)` } : {}),
        }}
      >
        {count === 0 ? (
          <p className="m-auto max-w-[13rem] px-3 py-6 text-center font-display text-[0.82rem] italic leading-relaxed text-muted-foreground/80">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
