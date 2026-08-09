import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, store_name, store_type, address, province, district, flavors, stock_status, estimated_quantity, approval_status, created_at'
    )
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

  const codes = [...new Set((data ?? []).map((report) => report.store_type))];
  const { data: storeTypes, error: storeTypesError } = codes.length
    ? await supabase.from('store_types').select('code, name').in('code', codes)
    : { data: [], error: null };
  if (storeTypesError) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

  const names = new Map((storeTypes ?? []).map((item) => [item.code, item.name]));
  return NextResponse.json({
    reports: (data ?? []).map((report) => ({
      ...report,
      store_type_name: names.get(report.store_type) ?? report.store_type,
    })),
  });
}
