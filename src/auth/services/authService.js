import { supabase } from "../../shared/index.js";

export const SESSION_KEY = 'auth.session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.username) return null;
    return s;
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (!session) return clearSession();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isDM(session) {
  return !!session && session.role === 'DM';
}

export async function login(username, password) {
  try {
    const u = String(username).trim().toLowerCase();
    // Use Supabase Auth with pseudo-email derived from username (valid domain)
    const email = `${u}@example.com`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message || 'Login failed' };

    const user = data.user;
    if (!user) return { ok: false, error: 'No user' };

    // Load profile to get stored username/role
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();
    if (pErr || !profile) {
      return { ok: false, error: 'Profile not found. Please sign up first.' };
    }

    return {
      ok: true,
      data: { userId: user.id, username: profile?.username || u, role: profile?.role || 'Player' },
    };
  } catch (error) {
    return { ok: false, error: error?.message || 'Login failed' };
  }
}

export async function signup(username, password, role) {
  try {
    const u = String(username).trim().toLowerCase();
    if (!u || !password || !role) {
      return { ok: false, error: 'Username, password, and role are required for sign up' };
    }

    const email = `${u}@example.com`;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: error.message || 'Signup failed' };

    const user = data.user;
    if (!user) return { ok: false, error: 'No user returned' };

    // Create profile row tied to auth user id
    const { error: pErr } = await supabase
      .from('profiles')
      .insert({ id: user.id, username: u, role, created_at: new Date().toISOString() });
    if (pErr) return { ok: false, error: pErr.message || 'Profile create failed' };

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Signup failed' };
  }
}
