import React from "react";
import {
  getSession,
  setSession,
  login as apiLogin,
  signup as apiSignup,
} from "../services/authService.js";
import { supabase } from "../../shared/index.js";

export default function Login({ onLoggedIn, goBack }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("Player");
  const [mode, setMode] = React.useState("login"); // 'login' | 'signup'
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Prefill role (and optionally username) from last session for convenience
  React.useEffect(() => {
    const s = getSession();
    if (s?.role) setRole(s.role);
    if (s?.username) setUsername(s.username);
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setLoading(true);
    try {
      const u = username.trim();
      const p = password;
      if (!u || !p) throw new Error("Username and password required");
      let data;
      if (mode === 'signup') {
        // Sign up does not log in automatically; return to login
        await apiSignup(u, p, role);
        setMode('login');
        setError('Account created. Please log in.');
        return;
      } else {
        data = await apiLogin(u, p);
      }
      // Persist selected role to the profile row for this user
      try {
        if (data?.userId) await supabase.from('profiles').update({ role }).eq('id', data.userId);
      } catch {}
      // On login, use the chosen role for routing; username from profile
      const session = { username: data.username, role, userId: data.userId };
      setSession(session);
      onLoggedIn?.(session);
    } catch (err) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">Login</h2>
        <span />
      </header>
      <main className="flex-1 flex items-center justify-center p-6 bg-gray-900">
        <form onSubmit={submit} className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded p-4 space-y-3 text-white">
          <div className="flex justify-between items-center">
            <div className="inline-flex rounded overflow-hidden border border-gray-600">
              <button type="button" className={`px-3 py-1 text-sm ${mode==='login'?'bg-blue-600 text-white':'bg-transparent text-gray-200'}`} onClick={()=>setMode('login')}>Login</button>
              <button type="button" className={`px-3 py-1 text-sm ${mode==='signup'?'bg-blue-600 text-white':'bg-transparent text-gray-200'}`} onClick={()=>setMode('signup')}>Sign Up</button>
            </div>
          </div>
          <label className="text-xs block">Username
            <input className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600" value={username} onChange={(e)=>setUsername(e.target.value)} />
          </label>
          <label className="text-xs block">Password
            <input type="password" className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </label>
          {mode === 'login' && (
            <label className="text-xs block">Role
              <select className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600" value={role} onChange={(e)=>setRole(e.target.value)}>
                <option>Player</option>
                <option>DM</option>
              </select>
            </label>
          )}
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button type="submit" disabled={loading} className="w-full px-3 py-2 bg-green-700 hover:bg-green-600 rounded disabled:opacity-60">
            {loading ? 'Please wait…' : (mode==='signup' ? 'Create Account' : 'Login')}
          </button>
        </form>
      </main>
    </div>
  );
}
