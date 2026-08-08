import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

export async function GET() {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(
      'id, reporter_id, store_name, address, province, district, flavors, stock_status, estimated_quantity, photo_url, note, created_at'
    )
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  if (reportsError) {
    console.error('[api/admin/reports] reports query failed', reportsError);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  const reporterIds = [...new Set((reports ?? []).flatMap((report) => (report.reporter_id ? [report.reporter_id] : [])))];
  const { data: profiles, error: profilesError } = reporterIds.length
    ? await supabase.from('profiles').select('id, display_name, email').in('id', reporterIds)
    : { data: [], error: null };

  if (profilesError) {
    console.error('[api/admin/reports] profiles query failed', profilesError);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const data = (reports ?? []).map(({ reporter_id: reporterId, ...report }) => ({
    ...report,
    profiles: reporterId ? (profilesById.get(reporterId) ?? null) : null,
  }));

  return NextResponse.json({ reports: data });
}
