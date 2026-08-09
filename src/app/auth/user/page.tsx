import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'กำลังไปหน้าเข้าสู่ระบบ | Loveza Hunt' };

type UserLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function UserLoginPage({ searchParams }: UserLoginPageProps) {
  const { next } = await searchParams;
  redirect(next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login');
}
