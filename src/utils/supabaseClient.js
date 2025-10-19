import { createClient } from '@supabase/supabase-js';

// Use Vite-prefixed env vars for client builds. These are required to be exposed at build-time.
const url =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (typeof window !== 'undefined' && (window.VITE_SUPABASE_URL || window.SUPABASE_URL));

const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && (window.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY));

if (!url || !key) {
  // Warn but avoid immediate crash; subsequent calls will fail gracefully
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url || 'https://example.supabase.co', key || 'public-anon-key');
