import type { Metadata } from 'next';
import type { AdminUserActivity } from 'src/sections/admin/users-panel';

import Alert from '@mui/material/Alert';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';

import { UsersPanel } from 'src/sections/admin/users-panel';

export const metadata: Metadata = { title: 'ผู้ใช้งาน | Loveza Admin' };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_user_activity');

  return (
    <DashboardContent maxWidth="xl">
      {error ? (
        <Alert severity="error">โหลดข้อมูลผู้ใช้งานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
      ) : (
        <UsersPanel users={(data ?? []) as AdminUserActivity[]} />
      )}
    </DashboardContent>
  );
}
