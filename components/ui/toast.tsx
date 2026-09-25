"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
type Item = { id: number; message: string; tone: Tone };

const EVENT = "callypso-decor:toast";
let seq = 0;

/** Fire a toast from anywhere (client side). */
export function toast(message: string, tone: Tone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Item>(EVENT, { detail: { id: ++seq, message, tone } }));
}

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const item = (e as CustomEvent<Item>).detail;
      setItems((xs) => [...xs.slice(-3), item]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== item.id)), 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end">
      {items.map((t) => {
        const Icon = t.tone === "error" ? AlertCircle : t.tone === "info" ? Info : CheckCircle2;
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-sm shadow-pop"
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.tone === "error" ? "text-destructive" : t.tone === "info" ? "text-info" : "text-success")} />
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
