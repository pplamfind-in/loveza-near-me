import { NextResponse } from 'next/server';

import { isSiteFont } from 'src/lib/site-font';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  type ProvinceColorSettings,
  isValidProvinceColorSettings,
} from 'src/lib/mapza/province-color-scale';
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
    requireReportApproval?: unknown;
    brandOwnerAcknowledged?: unknown;
    siteFont?: unknown;
    duplicateRadiusM?: unknown;
    searchRadiusM?: unknown;
    provinceColorSettings?: {
      noDataColor?: unknown;
      tier1Max?: unknown;
      tier1Color?: unknown;
      tier2Max?: unknown;
      tier2Color?: unknown;
      tier3Max?: unknown;
      tier3Color?: unknown;
      tier4Color?: unknown;
    };
  } | null;
  const requireReportApproval = payload?.requireReportApproval;
  const brandOwnerAcknowledged = payload?.brandOwnerAcknowledged;
  const siteFont = payload?.siteFont;
  const duplicateRadiusM = Number(payload?.duplicateRadiusM);
  const searchRadiusM = Number(payload?.searchRadiusM);
  const provinceColorSettings: ProvinceColorSettings = {
    noDataColor: String(payload?.provinceColorSettings?.noDataColor).toUpperCase(),
    tier1Max: Number(payload?.provinceColorSettings?.tier1Max),
    tier1Color: String(payload?.provinceColorSettings?.tier1Color).toUpperCase(),
    tier2Max: Number(payload?.provinceColorSettings?.tier2Max),
    tier2Color: String(payload?.provinceColorSettings?.tier2Color).toUpperCase(),
    tier3Max: Number(payload?.provinceColorSettings?.tier3Max),
    tier3Color: String(payload?.provinceColorSettings?.tier3Color).toUpperCase(),
    tier4Color: String(payload?.provinceColorSettings?.tier4Color).toUpperCase(),
  };

  if (typeof requireReportApproval !== 'boolean') {
    return NextResponse.json({ error: 'รูปแบบการอนุมัติรายงานไม่ถูกต้อง' }, { status: 400 });
  }

  if (typeof brandOwnerAcknowledged !== 'boolean') {
    return NextResponse.json({ error: 'สถานะการรับทราบของเจ้าของแบรนด์ไม่ถูกต้อง' }, { status: 400 });
  }

  if (!isSiteFont(siteFont)) {
    return NextResponse.json({ error: 'รูปแบบฟอนต์ไม่ถูกต้อง' }, { status: 400 });
  }

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

  if (!isValidProvinceColorSettings(provinceColorSettings)) {
    return NextResponse.json(
      {
        error:
          'ช่วงจำนวนจุดขายต้องเป็นจำนวนเต็ม เรียงจากน้อยไปมาก และสีต้องอยู่ในรูปแบบ HEX 6 หลัก',
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
      require_report_approval: requireReportApproval,
      brand_owner_acknowledged: brandOwnerAcknowledged,
      site_font: siteFont,
      duplicate_radius_m: duplicateRadiusM,
      search_radius_m: searchRadiusM,
      province_no_data_color: provinceColorSettings.noDataColor,
      province_tier_1_max: provinceColorSettings.tier1Max,
      province_tier_1_color: provinceColorSettings.tier1Color,
      province_tier_2_max: provinceColorSettings.tier2Max,
      province_tier_2_color: provinceColorSettings.tier2Color,
      province_tier_3_max: provinceColorSettings.tier3Max,
      province_tier_3_color: provinceColorSettings.tier3Color,
      province_tier_4_color: provinceColorSettings.tier4Color,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', true)
    .select(
      'require_report_approval, brand_owner_acknowledged, site_font, duplicate_radius_m, search_radius_m, province_no_data_color, province_tier_1_max, province_tier_1_color, province_tier_2_max, province_tier_2_color, province_tier_3_max, province_tier_3_color, province_tier_4_color, updated_at'
    )
    .single();

  if (error) {
    console.error('[api/admin/settings] update failed', error);
    return NextResponse.json({ error: 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      requireReportApproval: data.require_report_approval,
      brandOwnerAcknowledged: data.brand_owner_acknowledged,
      siteFont: data.site_font,
      duplicateRadiusM: data.duplicate_radius_m,
      searchRadiusM: data.search_radius_m,
      provinceColorSettings: {
        noDataColor: data.province_no_data_color,
        tier1Max: data.province_tier_1_max,
        tier1Color: data.province_tier_1_color,
        tier2Max: data.province_tier_2_max,
        tier2Color: data.province_tier_2_color,
        tier3Max: data.province_tier_3_max,
        tier3Color: data.province_tier_3_color,
        tier4Color: data.province_tier_4_color,
      },
      updatedAt: data.updated_at,
    },
  });
}
