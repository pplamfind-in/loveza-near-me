import type { Metadata } from 'next';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';
import { isSiteFont, DEFAULT_SITE_FONT } from 'src/lib/site-font';
import { DEFAULT_BRAND_OWNER_ACKNOWLEDGED } from 'src/lib/brand-owner-notice';
import { provinceColorSettingsFromRow } from 'src/lib/mapza/province-color-scale';

import { AdminSettingsPanel } from 'src/sections/admin/admin-settings-panel';

export const metadata: Metadata = { title: 'ตั้งค่าระบบ | Loveza Admin' };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('admin_settings')
    .select(
      'require_report_approval, brand_owner_acknowledged, site_font, duplicate_radius_m, search_radius_m, province_no_data_color, province_tier_1_max, province_tier_1_color, province_tier_2_max, province_tier_2_color, province_tier_3_max, province_tier_3_color, province_tier_4_color, updated_at'
    )
    .eq('id', true)
    .single();

  return (
    <DashboardContent maxWidth="xl">
      <AdminSettingsPanel
        initialRequireReportApproval={data?.require_report_approval ?? true}
        initialBrandOwnerAcknowledged={
          data?.brand_owner_acknowledged ?? DEFAULT_BRAND_OWNER_ACKNOWLEDGED
        }
        initialSiteFont={isSiteFont(data?.site_font) ? data.site_font : DEFAULT_SITE_FONT}
        initialDuplicateRadiusM={data?.duplicate_radius_m ?? 75}
        initialSearchRadiusM={data?.search_radius_m ?? 5000}
        initialProvinceColorSettings={provinceColorSettingsFromRow(data)}
        updatedAt={data?.updated_at ?? null}
        hasError={Boolean(error)}
      />
    </DashboardContent>
  );
}
