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

import { getLoginDestination } from 'src/auth/utils/login-destination';

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
  if (user?.app_metadata.role === 'admin') redirect('/admin');

  if (user) {
    const { data, error } = await supabase
      .from('account_types')
      .select('kind')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new Error('โหลดประเภทบัญชีไม่สำเร็จ');
    if (data) redirect(getLoginDestination(params.next, data.kind));

    const { error: createError } = await supabase
      .from('account_types')
      .upsert(
        { user_id: user.id, kind: 'hunter' },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );
    if (createError) throw new Error('สร้างโปรไฟล์นักสำรวจไม่สำเร็จ');

    const { data: account, error: readError } = await supabase
      .from('account_types')
      .select('kind')
      .eq('user_id', user.id)
      .single();
    if (readError) throw new Error('โหลดประเภทบัญชีไม่สำเร็จ');

    redirect(getLoginDestination(params.next, account.kind));
  }

  return (
    <AuthShell
      eyebrow="JOIN THE HUNT"
      title="พร้อมออกล่าแล้วใช่ไหม?"
      description="เข้าสู่ระบบด้วย Google เพื่อค้นหาร้านใกล้ตัว แจ้งพิกัดใหม่ และดูประวัติการตามล่าของคุณ"
    >
      <Stack
        spacing={2}
        textAlign="left"
        alignItems="flex-start"
        justifyContent="flex-start"
        sx={{ width: 1 }}
      >
        <GoogleLoginButton clientId={process.env.GOOGLE_CLIENT_ID ?? ''} nextPath={params.next} />
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="flex-start"
          justifyContent="flex-start"
          sx={{ width: 1, maxWidth: 340 }}
        >
          <Iconify
            icon="ri:shield-check-fill"
            width={16}
            sx={{ color: 'primary.main', flexShrink: 0, mt: 0.25 }}
          />
          <Box
            component="span"
            sx={{ color: 'var(--palette-text-secondary)', fontSize: 11, fontWeight: 700 }}
          >
            ใช้บัญชี Google เพื่อยืนยันตัวตนและจดจำประเภทบัญชีของคุณ
          </Box>
        </Stack>
        <Button
          component="a"
          href="/"
          size="large"
          variant="text"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{
            minHeight: 44,
            color: 'text.secondary',
            border: 0,
            borderRadius: '8px',
            bgcolor: 'transparent',
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': { bgcolor: 'primary.lighter', border: 0, boxShadow: 'none' },
          }}
        >
          กลับหน้าหลัก
        </Button>
      </Stack>
    </AuthShell>
  );
}
