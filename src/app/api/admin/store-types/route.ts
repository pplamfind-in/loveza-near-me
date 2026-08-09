import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { storeTypeMasterSchema } from 'src/app/admin/store-types/schema';
import { getStoreTypeLogoPath, STORE_TYPE_LOGO_BUCKET } from 'src/lib/supabase/store-type-logo';

const FIELDS = 'id, code, name, logo_url, sort_order, is_active, created_at, updated_at';

export async function GET() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabase
    .from('store_types')
    .select(FIELDS)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: 'โหลดข้อมูลไม่สำเร็จ' }, { status: 500 });
  return NextResponse.json({ storeTypes: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const parsed = storeTypeMasterSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from('store_types')
    .insert({ ...values, logo_url: values.logo_url || null })
    .select(FIELDS)
    .single();

  if (error?.code === '23505') {
    const imagePath = getStoreTypeLogoPath(values.logo_url);
    if (imagePath) await supabase.storage.from(STORE_TYPE_LOGO_BUCKET).remove([imagePath]);
    return NextResponse.json({ error: 'code นี้มีอยู่แล้ว' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: 'เพิ่มประเภทร้านไม่สำเร็จ' }, { status: 500 });
  return NextResponse.json({ storeType: data }, { status: 201 });
}
