import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

/** Client lecture publique (RLS appliquée) — utilisable côté API publique. */
export function supabaseAnon(): SupabaseClient {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL manquante dans .env');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY ?? '');
}

/** Client service role — bypass RLS. Jamais exposé côté client. */
export function supabaseService(): SupabaseClient {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL manquante dans .env');
  if (!SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante (requise côté serveur).');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
