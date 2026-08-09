import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { Iconify } from 'src/components/iconify';

import { AuthShell } from 'src/sections/auth-loveza/auth-shell';
import { GoogleLoginButton } from 'src/sections/auth-loveza/google-login-button';

import { getSafeRedirectPath } from 'src/auth/utils/safe-redirect';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Loveza Near Me',
  robots: NO_INDEX_ROBOTS,
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const safeUserPath = getSafeRedirectPath(params.next, '/account');
  const userPath = safeUserPath.startsWith('/admin') ? '/account' : safeUserPath;

  if (user) redirect(user.app_metadata.role === 'admin' ? '/admin' : userPath);

  return (
    <AuthShell
      eyebrow="LOVEZA ACCOUNT"
      title="เข้าสู่ระบบ Loveza"
      description="ใช้บัญชี Google เดียวกัน ระบบจะพาคุณไปยังพื้นที่ผู้ใช้งานหรือ Admin ตามสิทธิ์ที่ได้รับ"
    >
      <Stack spacing={1.5}>
        <GoogleLoginButton clientId={process.env.GOOGLE_CLIENT_ID ?? ''} nextPath={params.next} />
        <Button
          component="a"
          href="/"
          size="large"
          variant="outlined"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{
            minHeight: 48,
            color: '#351129',
            border: '2px solid #351129',
            borderRadius: 99,
            bgcolor: '#fff',
            fontWeight: 900,
            boxShadow: '3px 3px 0 #351129',
            '&:hover': {
              bgcolor: '#FFF1F8',
              border: '2px solid #351129',
              boxShadow: '1px 2px 0 #351129',
            },
          }}
        >
          กลับหน้าหลัก
        </Button>
      </Stack>
    </AuthShell>
  );
}
