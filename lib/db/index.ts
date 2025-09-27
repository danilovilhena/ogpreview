import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

// Supabase instance
let supabaseInstance: SupabaseClient<Database> | null = null;

// Initialize Supabase client
export function getSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseKey || !supabaseUrl) {
    throw new Error('Missing required environment variable: SUPABASE_KEY or SUPABASE_URL');
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

// Legacy function for compatibility
export async function initDb(): Promise<SupabaseClient<Database>> {
  return getSupabase();
}

export function getSupabaseClient(): { success: true; supabase: SupabaseClient<Database> } | { success: false; error: string; status: number } {
  try {
    const supabase = getSupabase();
    return { success: true, supabase };
  } catch {
    return { success: false, error: 'Database not available. Make sure Supabase is properly configured.', status: 503 };
  }
}

// Database service functions
export { MetadataService, SiteService } from './services';
