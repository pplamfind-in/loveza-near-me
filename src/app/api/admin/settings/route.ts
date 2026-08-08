import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { MIN_RADIUS_M, MAX_RADIUS_M, formatDuplicateRadius } from 'src/lib/admin/duplicate-radius';

export async function PUT(request: Request) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const payload = (await request.json().catch(() => null)) as { duplicateRadiusM?: unknown } | null;
  const duplicateRadiusM = Number(payload?.duplicateRadiusM);

  if (
    !Number.isInteger(duplicateRadiusM) ||
    duplicateRadiusM < MIN_RADIUS_M ||
    duplicateRadiusM > MAX_RADIUS_M
  ) {
    return NextResponse.json(
      {
        error: `ระยะตรวจซ้ำต้องอยู่ระหว่าง ${formatDuplicateRadius(MIN_RADIUS_M)}–${formatDuplicateRadius(MAX_RADIUS_M)}`,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('admin_settings')
    .update({
      duplicate_radius_m: duplicateRadiusM,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', true)
    .select('duplicate_radius_m, updated_at')
    .single();

  if (error) {
    console.error('[api/admin/settings] update failed', error);
    return NextResponse.json({ error: 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      duplicateRadiusM: data.duplicate_radius_m,
      updatedAt: data.updated_at,
    },
  });
}
