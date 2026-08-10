'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

type PromoteUserResult = {
  success: boolean;
  message: string;
};

export async function promoteUserToAdmin(userId: string): Promise<PromoteUserResult> {
  const parsedUserId = z.string().uuid().safeParse(userId);
  if (!parsedUserId.success) {
    return { success: false, message: 'รหัสผู้ใช้ไม่ถูกต้อง' };
  }

  const { supabase, user } = await requireAdminClient();
  if (!user) {
    return { success: false, message: 'ไม่มีสิทธิ์จัดการผู้ใช้งาน' };
  }

  const { error } = await supabase.rpc('admin_promote_user', {
    target_user_id: parsedUserId.data,
  });

  if (error) {
    console.error('[admin/users] promote user failed', {
      adminId: user.id,
      targetUserId: parsedUserId.data,
      error,
    });
    return {
      success: false,
      message: error.code === 'P0002' ? 'ไม่พบผู้ใช้ที่เลือก' : 'เปลี่ยนสิทธิ์ไม่สำเร็จ กรุณาลองอีกครั้ง',
    };
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/guide');

  return { success: true, message: 'ตั้งผู้ใช้นี้เป็น Admin แล้ว' };
}
