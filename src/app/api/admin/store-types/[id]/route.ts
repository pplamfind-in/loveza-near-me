import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { storeTypeMasterSchema } from 'src/app/admin/store-types/schema';
import { getStoreTypeLogoPath, STORE_TYPE_LOGO_BUCKET } from 'src/lib/supabase/store-type-logo';

const FIELDS = 'id, code, name, logo_url, sort_order, is_active, created_at, updated_at';
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const [{ id }, body] = await Promise.all([params, request.json()]);
  const parsed = storeTypeMasterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabase
    .from('store_types')
    .select('logo_url')
    .eq('id', id)
    .single();
  if (currentError) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });

  const values = parsed.data;
  const oldPath = getStoreTypeLogoPath(current.logo_url);
  const newPath = getStoreTypeLogoPath(values.logo_url);
  const { data, error } = await supabase
    .from('store_types')
    .update({ ...values, logo_url: values.logo_url || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(FIELDS)
    .single();

  if (error?.code === '23505') {
    if (newPath && newPath !== oldPath) await supabase.storage.from(STORE_TYPE_LOGO_BUCKET).remove([newPath]);
    return NextResponse.json({ error: 'code นี้มีอยู่แล้ว' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: 'แก้ไขข้อมูลไม่สำเร็จ' }, { status: 500 });

  if (oldPath && oldPath !== newPath) await supabase.storage.from(STORE_TYPE_LOGO_BUCKET).remove([oldPath]);
  return NextResponse.json({ storeType: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { data: current, error: currentError } = await supabase
    .from('store_types')
    .select('logo_url, code')
    .eq('id', id)
    .single();
  if (currentError) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
  if (current.code === 'unknown') {
    return NextResponse.json({ error: 'ไม่สามารถลบประเภทเริ่มต้นได้' }, { status: 409 });
  }

  const { error } = await supabase.from('store_types').delete().eq('id', id);
  if (error?.code === '23503') {
    return NextResponse.json({ error: 'ประเภทนี้ถูกใช้งานอยู่ กรุณาเลือกซ่อนแทนการลบ' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: 'ลบข้อมูลไม่สำเร็จ' }, { status: 500 });

  const path = getStoreTypeLogoPath(current.logo_url);
  if (path) await supabase.storage.from(STORE_TYPE_LOGO_BUCKET).remove([path]);
  return NextResponse.json({ status: 'success' });
}
