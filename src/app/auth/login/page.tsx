import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { Iconify } from 'src/components/iconify';

import { AuthShell } from 'src/sections/auth-loveza/auth-shell';
import { GoogleLoginButton } from 'src/sections/auth-loveza/google-login-button';

import { getSafeRedirectPath } from 'src/auth/utils/safe-redirect';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Loveza Hunt',
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
      eyebrow="JOIN THE HUNT"
      title="พร้อมออกล่าแล้วใช่ไหม?"
      description="เข้าสู่ระบบด้วย Google เพื่อค้นหาร้านใกล้ตัว แจ้งพิกัดใหม่ และดูประวัติการตามล่าของคุณ"
    >
      <Stack
        spacing={2}
        textAlign="center"
        alignItems="center"
        justifyContent="center"
        sx={{ width: 1 }}
      >
        <GoogleLoginButton clientId={process.env.GOOGLE_CLIENT_ID ?? ''} nextPath={params.next} />
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          justifyContent="center"
          sx={{ width: 1, maxWidth: 340 }}
        >
          <Iconify icon="ri:shield-check-fill" width={16} sx={{ color: '#25A56A' }} />
          <Box component="span" sx={{ color: '#756A77', fontSize: 11, fontWeight: 700 }}>
            ใช้เพื่อยืนยันผู้แจ้งพิกัดและลดข้อมูลซ้ำเท่านั้น
          </Box>
        </Stack>
        <Button
          component="a"
          href="/"
          size="large"
          variant="outlined"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{
            width: 1,
            maxWidth: 340,
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
