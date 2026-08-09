import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'กำลังไปหน้าเข้าสู่ระบบ | Loveza Hunt' };

export default function AdminLoginPage() {
  redirect('/auth/login');
}
