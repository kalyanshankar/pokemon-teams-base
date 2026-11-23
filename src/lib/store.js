import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

export const demoMode = !url || !key;
const supabase = demoMode ? null : createClient(url, key);

const COLUMNS = [
  'raw_paste', 'title', 'author', 'source_url', 'pokepaste_url', 'replica_code', 'format', 'notes',
  'rating', 'tags', 'members', 'species', 'items', 'moves', 'auto_tags', 'signature',
];
const clean = (row) => {
  const out = {};
  for (const c of COLUMNS) if (c in row) out[c] = row[c] === '' ? null : row[c];
  return out;
};

// ---------- Demo mode: teams live in this browser only ----------
const LS = 'teambase.demo.teams';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; } };
const writeLocal = (rows) => { try { localStorage.setItem(LS, JSON.stringify(rows)); } catch { /* storage full or blocked */ } };

// ---------- Auth ----------
export async function getSession() {
  if (demoMode) return { user: { email: 'demo' } };
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb) {
  if (demoMode) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  if (!demoMode) await supabase.auth.signOut();
}

// ---------- Teams ----------
export async function listTeams() {
  if (demoMode) return readLocal().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertTeam(row) {
  if (demoMode) {
    const now = new Date().toISOString();
    const saved = { ...clean(row), id: crypto.randomUUID(), created_at: now, updated_at: now };
    writeLocal([saved, ...readLocal()]);
    return saved;
  }
  const { data, error } = await supabase.from('teams').insert(clean(row)).select().single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id, row) {
  if (demoMode) {
    const rows = readLocal();
    const i = rows.findIndex((r) => r.id === id);
    rows[i] = { ...rows[i], ...clean(row), updated_at: new Date().toISOString() };
    writeLocal(rows);
    return rows[i];
  }
  const { data, error } = await supabase.from('teams').update(clean(row)).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id) {
  if (demoMode) { writeLocal(readLocal().filter((r) => r.id !== id)); return; }
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
