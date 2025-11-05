import { supabase } from '../../../utils/supabaseClient';

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
  const u = String(username).trim().toLowerCase();
  // Use Supabase Auth with pseudo-email derived from username (valid domain)
  const email = `${u}@example.com`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || 'Login failed');
  const user = data.user;
  if (!user) throw new Error('No user');
  // Load profile to get stored username/role
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single();
  if (pErr || !profile) {
    throw new Error('Profile not found. Please sign up first.');
  }
  return { userId: user.id, username: profile?.username || u, role: profile?.role || 'Player' };
}

export async function signup(username, password, role) {
  const u = String(username).trim().toLowerCase();
  if (!u || !password || !role) throw new Error('Missing fields');
  const email = `${u}@example.com`;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message || 'Signup failed');
  const user = data.user;
  if (!user) throw new Error('No user returned');
  // Create profile row tied to auth user id
  const { error: pErr } = await supabase
    .from('profiles')
    .insert({ id: user.id, username: u, role, created_at: new Date().toISOString() });
  if (pErr) throw new Error(pErr.message || 'Profile create failed');
  return { ok: true };
}
