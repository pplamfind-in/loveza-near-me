import { z } from 'zod';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { adminLocationSchema } from 'src/app/admin/locations/schema';

const LOCATION_FIELDS =
  'id, name, address, province, district, subdistrict, latitude, longitude, current_status, estimated_quantity, last_reported_at, is_active';

type LocationRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: LocationRouteContext) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'รหัสพิกัดไม่ถูกต้อง' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reports')
    .select('id, photo_url, approval_status, created_at')
    .eq('store_id', id)
    .not('photo_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'โหลดรูปภาพรายงานไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json(
    {
      images: (data ?? []).map((report) => ({
        id: report.id,
        image_url: `/api/admin/report-images/${report.id}/`,
        approval_status: report.approval_status,
        created_at: report.created_at,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export async function PATCH(request: Request, { params }: LocationRouteContext) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'รหัสพิกัดไม่ถูกต้อง' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }

  const parsed = adminLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูลพิกัดไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from('stores')
    .update({
      name: values.name,
      address: values.address || null,
      province: values.province,
      district: values.district || null,
      subdistrict: values.subdistrict || null,
      latitude: values.latitude,
      longitude: values.longitude,
      is_active: values.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(LOCATION_FIELDS)
    .single();

  if (error?.code === 'PGRST116') {
    return NextResponse.json({ error: 'ไม่พบสาขาที่ต้องการแก้ไข' }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: 'บันทึกข้อมูลสาขาไม่สำเร็จ' }, { status: 500 });
  }

  revalidatePath('/admin/locations');
  revalidatePath('/nearby');
  revalidatePath('/mapza');
  revalidatePath('/');

  return NextResponse.json({ store: data });
}
