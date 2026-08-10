import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { DashboardLayout } from 'src/layouts/dashboard';
import { getAdminNavData } from 'src/layouts/nav-config-admin';
import { AdminAccount } from 'src/layouts/dashboard/admin-account';

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

  const displayName =
    user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? 'Loveza Admin';
  const photoURL = user.user_metadata.avatar_url ?? user.user_metadata.picture ?? '';

  return (
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
            background:
              'radial-gradient(circle at 100% 0%, rgba(229,0,126,.08), transparent 24%), linear-gradient(180deg, #FFF8FC 0%, #F9F4FF 100%)',
          },
        },
      }}
    >
      {children}
    </DashboardLayout>
  );
}
