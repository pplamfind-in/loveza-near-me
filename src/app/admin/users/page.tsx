import type { Metadata } from 'next';
import type { AdminUserActivity } from 'src/sections/admin/users-panel';

import Alert from '@mui/material/Alert';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';

import { UsersPanel } from 'src/sections/admin/users-panel';

export const metadata: Metadata = { title: 'ผู้ใช้งาน | Loveza Admin' };

function maskDisplayName(displayName: string) {
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  if (!nameParts.length) return '-';
  if (nameParts.length === 1) return nameParts[0];

  return `${nameParts[0]} ***`;
}

function maskEmail(email: string) {
  const [localPart = ''] = email.trim().split('@');
  return localPart || '-';
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_user_activity');
  const users = ((data ?? []) as AdminUserActivity[]).map((user) => ({
    ...user,
    email: maskEmail(user.email),
    display_name: maskDisplayName(user.display_name),
  }));

  return (
    <DashboardContent maxWidth="xl">
      {error ? (
        <Alert severity="error">โหลดข้อมูลผู้ใช้งานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
      ) : (
        <UsersPanel users={users} />
      )}
    </DashboardContent>
  );
}
