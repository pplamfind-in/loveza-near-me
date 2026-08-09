import type { Metadata } from 'next';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';

import { AdminSettingsPanel } from 'src/sections/admin/admin-settings-panel';

export const metadata: Metadata = { title: 'ตั้งค่าระบบ | Loveza Admin' };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('admin_settings')
    .select('duplicate_radius_m, search_radius_m, updated_at')
    .eq('id', true)
    .single();

  return (
    <DashboardContent maxWidth="xl">
      <AdminSettingsPanel
        initialDuplicateRadiusM={data?.duplicate_radius_m ?? 75}
        initialSearchRadiusM={data?.search_radius_m ?? 5000}
        updatedAt={data?.updated_at ?? null}
        hasError={Boolean(error)}
      />
    </DashboardContent>
  );
}
