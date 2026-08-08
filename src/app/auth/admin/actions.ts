'use server';

import { redirect } from 'next/navigation';

import { createClient } from 'src/lib/supabase/server';

export type AdminLoginState = {
  error: string | null;
};

export async function adminLoginAction(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!username || !password) {
    return { error: 'กรุณากรอก Username และ Password' };
  }

  if (!adminUsername || !adminEmail) {
    return { error: 'ระบบ Admin ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ' };
  }

  if (username.toLowerCase() !== adminUsername.toLowerCase()) {
    return { error: 'Username หรือ Password ไม่ถูกต้อง' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });

  if (error || !data.user) {
    return { error: 'Username หรือ Password ไม่ถูกต้อง' };
  }

  if (data.user.app_metadata.role !== 'admin') {
    await supabase.auth.signOut();
    return { error: 'บัญชีนี้ไม่มีสิทธิ์ Admin' };
  }

  return redirect('/admin');
}
