"use client";

/**
 * Data layer — every read/write the app UI does goes through here.
 *
 * - Supabase configured AND a user signed in → `projects` table (see
 *   supabase/schema.sql). Any Supabase error (e.g. table not created yet)
 *   falls back to the local store so the UI keeps working.
 * - Otherwise → a localStorage store seeded from lib/demo/data.ts, with an
 *   in-memory fallback when storage is unavailable or full.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { L } from "@/lib/i18n/config";
import type { RoomStyle } from "@/components/room-scene";
import { projects as seedProjects, styles, type Project as DemoProject, type ProjectStatus } from "@/lib/demo/data";
import { getSupabase } from "@/lib/supabase/client";

export interface Project extends DemoProject {
  /** Uploaded photo (data URL). Absent for the seeded SVG demo projects. */
  imageBefore?: string;
  /** Generated look (data URL or remote URL). */
  imageAfter?: string;
}

export type NewProject = Pick<Project, "room" | "place" | "style" | "status"> &
  Partial<Pick<Project, "variants" | "saved" | "imageBefore" | "imageAfter">>;

export interface SessionUser { name: string; email: string; demo: boolean }

type Store = { projects: Project[]; likes: string[] };

const STORE_KEY = "callypso-decor:data:v1";
const SESSION_KEY = "callypso-decor:session:v1";
const CHANGE_EVENT = "callypso-decor:data-change";

export const styleName = (style: RoomStyle): L =>
  styles.find((s) => s.id === style)?.name ?? { tr: style, en: style };

/* ── Local store ─────────────────────────────────────────────────────────── */

let memory: Store | null = null;

function seed(): Store {
  return { projects: seedProjects.map((p) => ({ ...p })), likes: [] };
}

function readLocal(): Store {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    memory = raw ? (JSON.parse(raw) as Store) : seed();
  } catch {
    memory = seed();
  }
  return memory;
}

/** Returns false when the browser refused to persist (quota, private mode). */
function writeLocal(next: Store): boolean {
  memory = next;
  let persisted = true;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    persisted = false;
  }
  notify();
  return persisted;
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `p${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

/* ── Supabase ────────────────────────────────────────────────────────────── */

type Row = {
  id: string; room: L; place: string; style: RoomStyle; status: ProjectStatus;
  variants: number; saved: number; image_before: string | null; image_after: string | null; updated_at: string;
};

const fromRow = (r: Row): Project => ({
  id: r.id, room: r.room, place: r.place, style: r.style, styleName: styleName(r.style), status: r.status,
  variants: r.variants, saved: r.saved, updated: r.updated_at,
  imageBefore: r.image_before ?? undefined, imageAfter: r.image_after ?? undefined,
});

let supabaseBroken = false;

/** The signed-in Supabase client, or null → use the local store. */
async function remote() {
  const supabase = getSupabase();
  if (!supabase || supabaseBroken) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ? supabase : null;
}

export async function dataMode(): Promise<"supabase" | "local"> {
  return (await remote()) ? "supabase" : "local";
}

/* ── Projects ────────────────────────────────────────────────────────────── */

export async function listProjects(): Promise<Project[]> {
  const sb = await remote();
  if (sb) {
    const { data, error } = await sb.from("projects").select("*").order("updated_at", { ascending: false });
    if (!error && data) return (data as Row[]).map(fromRow);
    // table missing / RLS error → stay local for this session
    if (!supabaseBroken) { supabaseBroken = true; notify(); }
  }
  return [...readLocal().projects].sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function createProject(input: NewProject): Promise<{ project: Project; persisted: boolean }> {
  const now = new Date().toISOString();
  const sb = await remote();
  if (sb) {
    const { data, error } = await sb
      .from("projects")
      .insert({
        room: input.room, place: input.place, style: input.style, status: input.status,
        variants: input.variants ?? 1, saved: input.saved ?? 0,
        image_before: input.imageBefore ?? null, image_after: input.imageAfter ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    notify();
    return { project: fromRow(data as Row), persisted: true };
  }
  const project: Project = {
    id: newId(), room: input.room, place: input.place, style: input.style, styleName: styleName(input.style),
    status: input.status, variants: input.variants ?? 1, saved: input.saved ?? 0, updated: now,
    imageBefore: input.imageBefore, imageAfter: input.imageAfter,
  };
  const store = readLocal();
  const persisted = writeLocal({ ...store, projects: [project, ...store.projects] });
  return { project, persisted };
}

export async function updateProject(id: string, patch: Partial<Pick<Project, "place" | "status" | "style" | "saved">>) {
  const sb = await remote();
  if (sb) {
    const { error } = await sb.from("projects").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(error.message);
    notify();
    return;
  }
  const store = readLocal();
  writeLocal({
    ...store,
    projects: store.projects.map((p) =>
      p.id === id ? { ...p, ...patch, ...(patch.style ? { styleName: styleName(patch.style) } : {}), updated: new Date().toISOString() } : p,
    ),
  });
}

export async function deleteProject(id: string) {
  const sb = await remote();
  if (sb) {
    const { error } = await sb.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
    notify();
    return;
  }
  const store = readLocal();
  writeLocal({ ...store, projects: store.projects.filter((p) => p.id !== id) });
}

/* ── Gallery likes (always local — the gallery is sample content) ─────────── */

export function getLikes(): string[] {
  return readLocal().likes;
}

export function toggleLike(id: string): boolean {
  const store = readLocal();
  const liked = !store.likes.includes(id);
  writeLocal({ ...store, likes: liked ? [...store.likes, id] : store.likes.filter((x) => x !== id) });
  return liked;
}

/** Restore the seeded demo data (local store only). */
export function resetDemoData() {
  writeLocal(seed());
}

/* ── Session ─────────────────────────────────────────────────────────────── */

export function setDemoSession(user: Omit<SessionUser, "demo">) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, demo: true })); } catch { /* memory-only */ }
  notify();
}

function readDemoSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user;
    if (u) return { name: (u.user_metadata?.full_name as string) || u.email?.split("@")[0] || "", email: u.email ?? "", demo: false };
  }
  return readDemoSession();
}

export async function signOut() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
  supabaseBroken = false;
  notify();
}

/* ── React hooks ─────────────────────────────────────────────────────────── */

function useDataChange(cb: () => void) {
  useEffect(() => {
    window.addEventListener(CHANGE_EVENT, cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) { memory = null; cb(); }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, cb);
      window.removeEventListener("storage", onStorage);
    };
  }, [cb]);
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  useDataChange(load);
  return { projects, loading };
}

const NO_LIKES: string[] = [];

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORE_KEY) { memory = null; cb(); }
  };
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLikes() {
  return useSyncExternalStore(subscribe, getLikes, () => NO_LIKES);
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mode, setMode] = useState<"supabase" | "local">("local");
  const load = useCallback(() => {
    getSession().then(setUser);
    dataMode().then(setMode);
  }, []);
  useEffect(load, [load]);
  useDataChange(load);
  return { user, mode };
}
