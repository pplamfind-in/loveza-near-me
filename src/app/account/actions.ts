'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { createClient } from 'src/lib/supabase/server';

export type DisplayNameState = { error?: string; success?: string };
const nameSchema = z
  .string()
  .trim()
  .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
  .max(60, 'ชื่อยาวได้ไม่เกิน 60 ตัวอักษร')
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, 'ชื่อมีอักขระที่ไม่รองรับ');

export async function updateDisplayName(
  _: DisplayNameState,
  form: FormData
): Promise<DisplayNameState> {
  const name = nameSchema.safeParse(form.get('display_name'));
  if (!name.success) return { error: name.error.issues[0].message };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนแก้ไขชื่อ' };
  const { error } = await db.auth.updateUser({ data: { display_name: name.data } });
  if (error) return { error: 'บันทึกชื่อไม่สำเร็จ กรุณาลองอีกครั้ง' };
  revalidatePath('/', 'layout');
  return { success: 'บันทึกชื่อแสดงผลแล้ว' };
}

export async function updateAccountAvatar(avatar: string): Promise<DisplayNameState> {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนเปลี่ยนรูป' };
  const { getAccountAvatars } = await import('src/lib/account-avatars');
  const options = await getAccountAvatars();
  if (avatar !== '' && !options.includes(avatar))
    return { error: 'กรุณาเลือกรูปจากรายการที่มีให้' };
  const { error } = await db.auth.updateUser({ data: { loveza_avatar: avatar || null } });
  if (error) return { error: 'บันทึกรูปไม่สำเร็จ กรุณาลองอีกครั้ง' };
  revalidatePath('/', 'layout');
  return { success: 'เปลี่ยนรูปโปรไฟล์แล้ว' };
}
