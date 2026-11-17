import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { DashboardLayout } from 'src/layouts/dashboard';
import { getUserDisplayName } from 'src/lib/user-display-name';
import { getAdminNavData } from 'src/layouts/nav-config-admin';
import { AdminAccount } from 'src/layouts/dashboard/admin-account';

import { AdminUI } from 'src/sections/admin/admin-ui';

type AdminLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = { robots: NO_INDEX_ROBOTS };

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata.role !== 'admin') redirect('/auth/login');

  const { count: pendingReportsCount } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending');

  const displayName = getUserDisplayName(user, 'Loveza Admin');
  const photoURL = user.user_metadata.avatar_url ?? user.user_metadata.picture ?? '';

  return (
    <AdminUI>
      <DashboardLayout
        slotProps={{
          nav: {
            data: getAdminNavData(pendingReportsCount ?? 0),
            hideWorkspace: true,
            slots: { bottomArea: null },
          },
          header: {
            slots: {
              rightArea: (
                <AdminAccount
                  displayName={displayName}
                  email={user.email ?? ''}
                  photoURL={photoURL}
                />
              ),
            },
          },
          main: {
            sx: {
              background: 'linear-gradient(180deg, #F4F2E8 0%, #FBF6ED 300px)',
            },
          },
        }}
      >
        {children}
      </DashboardLayout>
    </AdminUI>
  );
}
