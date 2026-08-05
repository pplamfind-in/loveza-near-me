import { createBrowserClient } from '@supabase/ssr';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export function createClient() {
  return createBrowserClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
}
