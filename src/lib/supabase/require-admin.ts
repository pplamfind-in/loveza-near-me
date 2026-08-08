import type { User } from '@supabase/supabase-js';

import { createClient } from './server';

/**
 * Shared by every /api/admin/* route so the admin-role check only lives in
 * one place. Returns `user: null` instead of throwing so each route can
 * decide its own error response shape.
 */
export async function requireAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user && user.app_metadata.role === 'admin';

  return { supabase, user: (isAdmin ? user : null) as User | null };
}
