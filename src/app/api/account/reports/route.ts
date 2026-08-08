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
      'id, store_name, address, province, district, flavors, stock_status, estimated_quantity, approval_status, created_at'
    )
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

  return NextResponse.json({ reports: data ?? [] });
}
