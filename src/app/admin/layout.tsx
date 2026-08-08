import { redirect } from 'next/navigation';

import { createClient } from 'src/lib/supabase/server';
import { DashboardLayout } from 'src/layouts/dashboard';
import { adminNavData } from 'src/layouts/nav-config-admin';
import { AdminAccount } from 'src/layouts/dashboard/admin-account';

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata.role !== 'admin') redirect('/auth/login');

  const displayName =
    user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? 'Loveza Admin';
  const photoURL = user.user_metadata.avatar_url ?? user.user_metadata.picture ?? '';

  return (
    <DashboardLayout
      slotProps={{
        nav: {
          data: adminNavData,
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
        main: { sx: { bgcolor: '#f7f3fb' } },
      }}
    >
      {children}
    </DashboardLayout>
  );
}
