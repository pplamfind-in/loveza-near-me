import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('store_types')
    .select('id, code, name, logo_url, sort_order, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: 'โหลดประเภทร้านไม่สำเร็จ' }, { status: 500 });
  return NextResponse.json({ storeTypes: data ?? [] });
}
