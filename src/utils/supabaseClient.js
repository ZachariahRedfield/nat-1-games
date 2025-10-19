import { createClient } from '@supabase/supabase-js';

// Prefer SUPABASE_URL / SUPABASE_ANON_KEY, with fallbacks for Vite-prefixed or window-injected values.
const url =
  import.meta.env.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof window !== 'undefined' && window.SUPABASE_URL);

const key =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY);

if (!url || !key) {
  // Warn but avoid immediate crash; subsequent calls will fail gracefully
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing: SUPABASE_URL / SUPABASE_ANON_KEY');
}

export const supabase = createClient(url || 'https://example.supabase.co', key || 'public-anon-key');
