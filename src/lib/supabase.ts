import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment or localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('translogix_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('translogix_supabase_key') : null;

export const SUPABASE_URL = storedUrl || envUrl || '';
export const SUPABASE_ANON_KEY = storedKey || envAnonKey || '';

export const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

// Real Supabase client instance (or null if not yet configured)
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
  latencyMs?: number;
  tablesVerified?: string[];
  error?: string;
}

/**
 * Checks connectivity to live Supabase PostgreSQL
 */
export async function testSupabaseConnection(url?: string, key?: string): Promise<ConnectionTestResult> {
  const targetUrl = url || SUPABASE_URL;
  const targetKey = key || SUPABASE_ANON_KEY;

  if (!targetUrl || !targetKey || targetUrl.includes('your-project')) {
    return {
      connected: false,
      message: 'Supabase credentials not configured yet. Running in high-fidelity offline/demo mode.',
    };
  }

  const start = performance.now();
  try {
    const client = createClient(targetUrl, targetKey);
    // Attempt to query the public countries table
    const { data, error } = await client.from('countries').select('id, country_name').limit(2);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase, but query failed (Check migrations / RLS): ${error.message}`,
        error: error.message,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase PostgreSQL (${latencyMs}ms)`,
      latencyMs,
      tablesVerified: ['countries', 'shipments', 'profiles'],
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect: ${err.message || 'Network error'}`,
      error: err.message,
    };
  }
}
