import { redirect } from 'next/navigation';

import { createClient } from 'src/lib/supabase/server';

import { MainLayout } from './layout';

type LovezaMainLayoutProps = {
  children: React.ReactNode;
};

export async function LovezaMainLayout({ children }: LovezaMainLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.role === 'admin') redirect('/admin');

  const initialUser = user
    ? {
        displayName:
          user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? 'Loveza User',
        email: user.email ?? '',
        photoURL: user.user_metadata.avatar_url ?? user.user_metadata.picture ?? '',
        role: user.app_metadata.role ?? 'user',
      }
    : null;

  return (
    <MainLayout
      initialUser={initialUser}
      slotProps={{ footer: { sx: { display: 'none' } } }}
    >
      {children}
    </MainLayout>
  );
}
