import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getAdminNetworkStats } from 'src/lib/admin/get-network-stats';

export async function GET() {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { stats, error } = await getAdminNetworkStats(supabase);

  if (error) {
    console.error('[api/admin/network/stats] query failed', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  return NextResponse.json({ stats });
}
