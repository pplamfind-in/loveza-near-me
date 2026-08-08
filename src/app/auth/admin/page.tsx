import type { Metadata } from 'next';

import { AuthShell } from 'src/sections/auth-loveza/auth-shell';
import { AdminLoginForm } from 'src/sections/auth-loveza/admin-login-form';

export const metadata: Metadata = { title: 'Admin Login | Loveza Near Me' };

export default function AdminLoginPage() {
  return (
    <AuthShell
      eyebrow="ADMIN ACCESS"
      title="เข้าสู่ระบบผู้ดูแล"
      description="สำหรับตรวจสอบแหล่งที่มาของรายงาน อนุมัติพิกัด และดูแลสถานะสินค้าใน Dashboard"
    >
      <AdminLoginForm />
    </AuthShell>
  );
}
