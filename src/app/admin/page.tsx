import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';
import { createClient } from 'src/lib/supabase/server';
import { getReportsByStatus } from 'src/services/reports.service';

import { EmptyState } from 'src/components/common/empty-state';
import { MobileHeader } from 'src/components/layout/mobile-header';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';

import { AdminDashboard } from './admin-dashboard';
import { AdminSignInForm } from './admin-sign-in-form';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `หลังบ้านผู้ดูแล | ${CONFIG.appName}` };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <MobileAppShell hideBottomNav>
        <MobileHeader title="เข้าสู่ระบบผู้ดูแล" />
        <AdminSignInForm />
      </MobileAppShell>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return (
      <MobileAppShell hideBottomNav>
        <MobileHeader title="หลังบ้านผู้ดูแล" />
        <EmptyState
          title="ไม่มีสิทธิ์เข้าถึง"
          description="บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ"
        />
      </MobileAppShell>
    );
  }

  const [pending, approved, rejected] = await Promise.all([
    getReportsByStatus(supabase, 'pending'),
    getReportsByStatus(supabase, 'approved'),
    getReportsByStatus(supabase, 'rejected'),
  ]);

  return (
    <MobileAppShell hideBottomNav>
      <MobileHeader title="หลังบ้านผู้ดูแล" />
      <AdminDashboard pending={pending} approved={approved} rejected={rejected} />
    </MobileAppShell>
  );
}
