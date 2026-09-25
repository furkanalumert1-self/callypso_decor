"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Menu as MenuIcon, RotateCcw, FolderOpen } from "lucide-react";
import appConfig from "@/app.config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Dialog } from "@/components/ui/dialog";
import { Menu } from "@/components/ui/menu";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { toast } from "@/components/ui/toast";
import { useLang } from "@/components/i18n/language-provider";
import { activity } from "@/lib/demo/data";
import { resetDemoData, useProjects, useSession } from "@/lib/data";
import { cn, formatRelative } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, ui } = useLang();
  const { mode } = useSession();
  const { projects } = useProjects();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(true);
  const current = appConfig.nav.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );

  // ⌘K / Ctrl+K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const pageHits = appConfig.nav.filter((n) => !q || t(n.label).toLowerCase().includes(q));
  const projectHits = q
    ? projects.filter((p) => [t(p.room), p.place, t(p.styleName)].some((s) => s.toLowerCase().includes(q))).slice(0, 6)
    : [];

  function go(href: string) {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur sm:gap-4 sm:px-5">
      <button
        type="button"
        aria-label={ui.menu}
        onClick={() => setNavOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <h1 className="truncate font-display text-lg font-semibold tracking-tight">
        {current ? t(current.label) : ""}
      </h1>
      {mode === "local" && (
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">{ui.demoBadge}</span>
          <button
            type="button"
            onClick={() => { resetDemoData(); toast(ui.resetDone); }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> {ui.resetDemo}
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground hover:border-primary/40 lg:flex"
        >
          <Search className="h-4 w-4" />
          <span>{ui.search}</span>
          <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </button>
        <button
          type="button"
          aria-label={ui.search}
          onClick={() => setSearchOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <LanguageToggle className="mr-1" />
        <Menu
          label={ui.notifications}
          triggerClassName="relative grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          trigger={
            <>
              <Bell className="h-[18px] w-[18px]" />
              {unread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
            </>
          }
        >
          <div className="w-72">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
              <p className="text-sm font-semibold">{ui.notifications}</p>
              {unread && (
                <button type="button" onClick={() => setUnread(false)} className="text-xs font-medium text-primary hover:underline">{ui.markRead}</button>
              )}
            </div>
            {unread ? (
              <ul className="max-h-72 overflow-y-auto">
                {activity.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-3.5 py-2.5 text-[13px] leading-snug hover:bg-muted">
                    <span className="font-medium">{a.who}</span> {t(a.action)} <span className="font-medium">{a.target}</span>
                    <p className="text-[11px] text-muted-foreground">{formatRelative(a.at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3.5 py-6 text-center text-sm text-muted-foreground">{ui.noNotifications}</p>
            )}
          </div>
        </Menu>
        <ThemeToggle />
      </div>

      {/* mobile nav drawer */}
      <Dialog open={navOpen} onClose={() => setNavOpen(false)} title={ui.menu} side="left">
        <div className="space-y-4 p-4">
          <Logo />
          <nav className="space-y-1">
            {appConfig.nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", active ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>
          {mode === "local" && (
            <button
              type="button"
              onClick={() => { resetDemoData(); toast(ui.resetDone); setNavOpen(false); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {ui.resetDemo} · {ui.demoBadge}
            </button>
          )}
        </div>
      </Dialog>

      {/* search / command palette */}
      <Dialog open={searchOpen} onClose={() => { setSearchOpen(false); setQuery(""); }} title={ui.search}>
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const first = projectHits[0] ? `/projects#${projectHits[0].id}` : pageHits[0]?.href;
                if (first) go(first);
              }}
              placeholder={ui.search}
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="mt-4 space-y-4">
            {projectHits.length > 0 && (
              <div>
                <p className="label-mono mb-1.5 text-muted-foreground">{ui.projectsLabel}</p>
                {projectHits.map((p) => (
                  <button key={p.id} type="button" onClick={() => go(`/projects#${p.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{t(p.room)} · {p.place}</span>
                    <span className="text-xs text-muted-foreground">{t(p.styleName)}</span>
                  </button>
                ))}
              </div>
            )}
            {pageHits.length > 0 && (
              <div>
                <p className="label-mono mb-1.5 text-muted-foreground">{ui.pages}</p>
                {pageHits.map((n) => (
                  <button key={n.href} type="button" onClick={() => go(n.href)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted">
                    <Icon name={n.icon} className="h-4 w-4 text-muted-foreground" />
                    {t(n.label)}
                  </button>
                ))}
              </div>
            )}
            {!projectHits.length && !pageHits.length && <p className="py-6 text-center text-sm text-muted-foreground">{ui.noResults}</p>}
          </div>
        </div>
      </Dialog>
    </header>
  );
}
