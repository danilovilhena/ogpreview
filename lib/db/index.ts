import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

// Supabase instance
let supabaseInstance: SupabaseClient<Database> | null = null;

// Initialize Supabase client
export function getSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = 'https://vlkrjactabvvaheluaij.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseKey) {
    throw new Error('Missing required environment variable: SUPABASE_KEY');
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

// Legacy function for compatibility
export async function initDb(): Promise<SupabaseClient<Database>> {
  return getSupabase();
}

// Database service functions
export { MetadataService, SiteService } from './services';
