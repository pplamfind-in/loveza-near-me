import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component during render — safe to ignore
          // because middleware/route handlers refresh the session cookies.
        }
      },
    },
  });
}
