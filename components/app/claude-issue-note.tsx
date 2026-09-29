"use client";

import { Info } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";

export type ClaudeIssue = { code: "no_key" | "auth" | "workspace" | "not_found" | "rate_limit" | "billing" | "refusal" | "error"; detail: string };

const TEXT: Record<ClaudeIssue["code"], { tr: string; en: string }> = {
  no_key: {
    tr: "Claude kontrolü kapalı — ANTHROPIC_API_KEY bu dağıtımda yok. Değişkeni ekledikten sonra Vercel'de Redeploy gerekir.",
    en: "Claude check is off — ANTHROPIC_API_KEY isn't available in this deployment. Redeploy on Vercel after adding it.",
  },
  auth: { tr: "Claude kontrolü yapılamadı — API anahtarı geçersiz ya da yetkisiz.", en: "Claude check failed — the API key is invalid or unauthorised." },
  workspace: {
    tr: "Claude kontrolü yapılamadı — API anahtarı bir workspace'e bağlı değil. Console'da bir workspace içinde yeni anahtar oluştur ya da Vercel'e ANTHROPIC_WORKSPACE_ID ekleyip Redeploy et.",
    en: "Claude check failed — the API key isn't scoped to a workspace. Create a key inside a workspace in the Console, or add ANTHROPIC_WORKSPACE_ID on Vercel and redeploy.",
  },
  not_found: { tr: "Claude kontrolü yapılamadı — model bu Anthropic hesabında erişilebilir değil.", en: "Claude check failed — the model isn't available on this Anthropic account." },
  rate_limit: { tr: "Claude kontrolü yapılamadı — hız/kota sınırına takıldı, biraz sonra tekrar dene.", en: "Claude check failed — rate limit reached, try again shortly." },
  billing: { tr: "Claude kontrolü yapılamadı — Anthropic hesabında kredi yetersiz.", en: "Claude check failed — the Anthropic account is out of credit." },
  refusal: { tr: "Claude bu görsel için kontrolü reddetti.", en: "Claude declined to check this image." },
  error: { tr: "Claude kontrolü beklenmeyen bir hatayla yapılamadı.", en: "Claude check failed with an unexpected error." },
};

/** Explains why the Claude structure/product check is missing from a result. */
export function ClaudeIssueNote({ issue }: { issue: ClaudeIssue }) {
  const { lang } = useLang();
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        <p>{TEXT[issue.code][lang]}</p>
        {issue.code !== "no_key" && issue.detail && <p className="mt-0.5 font-mono text-[10px] opacity-70">{issue.detail}</p>}
      </div>
    </div>
  );
}
