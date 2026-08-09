import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  formatRadiusM,
  MAX_SEARCH_RADIUS_M,
  MIN_SEARCH_RADIUS_M,
  MAX_DUPLICATE_RADIUS_M,
  MIN_DUPLICATE_RADIUS_M,
} from 'src/lib/admin/duplicate-radius';

export async function PUT(request: Request) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const payload = (await request.json().catch(() => null)) as {
    duplicateRadiusM?: unknown;
    searchRadiusM?: unknown;
  } | null;
  const duplicateRadiusM = Number(payload?.duplicateRadiusM);
  const searchRadiusM = Number(payload?.searchRadiusM);

  if (
    !Number.isInteger(duplicateRadiusM) ||
    duplicateRadiusM < MIN_DUPLICATE_RADIUS_M ||
    duplicateRadiusM > MAX_DUPLICATE_RADIUS_M
  ) {
    return NextResponse.json(
      {
        error: `ระยะตรวจซ้ำต้องอยู่ระหว่าง ${formatRadiusM(MIN_DUPLICATE_RADIUS_M)}–${formatRadiusM(MAX_DUPLICATE_RADIUS_M)}`,
      },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(searchRadiusM) ||
    searchRadiusM < MIN_SEARCH_RADIUS_M ||
    searchRadiusM > MAX_SEARCH_RADIUS_M
  ) {
    return NextResponse.json(
      {
        error: `ระยะค้นหาต้องอยู่ระหว่าง ${formatRadiusM(MIN_SEARCH_RADIUS_M)}–${formatRadiusM(MAX_SEARCH_RADIUS_M)}`,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('admin_settings')
    .update({
      duplicate_radius_m: duplicateRadiusM,
      search_radius_m: searchRadiusM,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', true)
    .select('duplicate_radius_m, search_radius_m, updated_at')
    .single();

  if (error) {
    console.error('[api/admin/settings] update failed', error);
    return NextResponse.json({ error: 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      duplicateRadiusM: data.duplicate_radius_m,
      searchRadiusM: data.search_radius_m,
      updatedAt: data.updated_at,
    },
  });
}
