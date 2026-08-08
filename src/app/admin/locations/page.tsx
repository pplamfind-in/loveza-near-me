import type { Metadata } from 'next';
import type { AdminStoreLocation } from 'src/sections/admin/all-locations-panel';

import Alert from '@mui/material/Alert';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';

import { AllLocationsPanel } from 'src/sections/admin/all-locations-panel';

export const metadata: Metadata = { title: 'พิกัดทั้งหมด | Loveza Admin' };

export default async function AdminLocationsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select(
      'id, name, address, province, district, subdistrict, latitude, longitude, current_status, estimated_quantity, last_reported_at, is_active'
    )
    .order('last_reported_at', { ascending: false, nullsFirst: false });

  return (
    <DashboardContent maxWidth="xl">
      {error ? (
        <Alert severity="error">โหลดข้อมูลพิกัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
      ) : (
        <AllLocationsPanel stores={(data ?? []) as AdminStoreLocation[]} />
      )}
    </DashboardContent>
  );
}
