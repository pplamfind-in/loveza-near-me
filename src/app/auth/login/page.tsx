import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { createClient } from 'src/lib/supabase/server';

import { AuthShell } from 'src/sections/auth-loveza/auth-shell';
import { GoogleLoginButton } from 'src/sections/auth-loveza/google-login-button';

import { getSafeRedirectPath } from 'src/auth/utils/safe-redirect';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ | Loveza Near Me' };

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
      <GoogleLoginButton clientId={process.env.GOOGLE_CLIENT_ID ?? ''} nextPath={params.next} />
    </AuthShell>
  );
}
