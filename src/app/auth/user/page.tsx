import type { Metadata } from 'next';

import { AuthShell } from 'src/sections/auth-loveza/auth-shell';
import { GoogleLoginButton } from 'src/sections/auth-loveza/google-login-button';

export const metadata: Metadata = { title: 'เข้าสู่ระบบด้วย Google | Loveza Near Me' };

type UserLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function UserLoginPage({ searchParams }: UserLoginPageProps) {
  const { next } = await searchParams;
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';

  return (
    <AuthShell
      eyebrow="COMMUNITY LOGIN"
      title="เข้าสู่ระบบเพื่อช่วยบอกต่อ"
      description="ยืนยันตัวตนด้วย Google ก่อนแจ้งร้านและสถานะสินค้า เพื่อให้ข้อมูลใน Community น่าเชื่อถือ"
    >
      <GoogleLoginButton clientId={googleClientId} nextPath={next} />
    </AuthShell>
  );
}
