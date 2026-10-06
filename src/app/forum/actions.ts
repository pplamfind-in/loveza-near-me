'use server';

import type { ForumActionState } from './schema';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from 'src/lib/supabase/server';
import { getUserDisplayName } from 'src/lib/user-display-name';
import { compressForumImage } from 'src/lib/supabase/compress-forum-image';
import {
  FORUM_IMAGE_TYPES,
  FORUM_IMAGE_BUCKET,
  MAX_FORUM_IMAGE_SIZE,
} from 'src/lib/supabase/forum-image';

import { idSchema, threadSchema, commentSchema } from './schema';

export async function saveThread(_: ForumActionState, form: FormData): Promise<ForumActionState> {
  const parsed = threadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนตั้งกระทู้' };
  const id = form.get('id');
  if (id && !idSchema.safeParse(id).success) return { error: 'กระทู้ไม่ถูกต้อง' };
  let oldImage: string | null = null;
  if (id) {
    const existing = await db
      .from('forum_threads')
      .select('image_path')
      .eq('id', id)
      .eq('author_id', user.id)
      .maybeSingle();
    if (existing.error || !existing.data) return { error: 'ไม่พบกระทู้ หรือคุณไม่มีสิทธิ์แก้ไข' };
    oldImage = existing.data.image_path;
  }
  const image = form.get('image');
  let uploaded: string | null = null;
  let imagePath = form.get('remove_image') === 'true' ? null : oldImage;
  if (image instanceof File && image.size > 0) {
    if (image.size > MAX_FORUM_IMAGE_SIZE || !FORUM_IMAGE_TYPES.includes(image.type))
      return { error: 'รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB' };
    const bytes = Buffer.from(await image.arrayBuffer());
    const format = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'jpg'
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
          ? 'webp'
          : null;
    const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    if (!format || mime !== image.type) return { error: 'ไฟล์รูปภาพไม่ถูกต้อง' };
    let compressed: Buffer;
    try {
      compressed = await compressForumImage(bytes);
    } catch {
      return { error: 'แปลงรูปภาพไม่สำเร็จ กรุณาลองรูปอื่น (ไฟล์ที่เก็บต้องไม่เกิน 2MB)' };
    }
    uploaded = `${user.id}/${crypto.randomUUID()}.webp`;
    const upload = await db.storage
      .from(FORUM_IMAGE_BUCKET)
      .upload(uploaded, compressed, { contentType: 'image/webp', upsert: false });
    if (upload.error) return { error: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่' };
    imagePath = uploaded;
  }
  const values = { ...parsed.data, image_path: imagePath };
  const result = id
    ? await db
        .from('forum_threads')
        .update(values)
        .eq('id', id)
        .eq('author_id', user.id)
        .select('id')
        .maybeSingle()
    : await db
        .from('forum_threads')
        .insert({ ...values, author_name: getUserDisplayName(user) })
        .select('id')
        .single();
  if (result.error || !result.data) {
    if (uploaded) await db.storage.from(FORUM_IMAGE_BUCKET).remove([uploaded]);
    return {
      error: id ? 'แก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง' : 'ตั้งกระทู้ไม่สำเร็จ กรุณาลองอีกครั้ง',
    };
  }
  if (oldImage && oldImage !== imagePath)
    await db.storage.from(FORUM_IMAGE_BUCKET).remove([oldImage]);
  revalidatePath('/forum');
  if (id) {
    revalidatePath(`/forum/${id}`);
    return { success: 'บันทึกกระทู้แล้ว' };
  }
  return redirect(`/forum/${result.data.id}`);
}

export async function saveComment(_: ForumActionState, form: FormData): Promise<ForumActionState> {
  const body = commentSchema.safeParse(form.get('body'));
  const threadId = idSchema.safeParse(form.get('thread_id'));
  if (!body.success) return { error: body.error.issues[0].message };
  if (!threadId.success) return { error: 'กระทู้ไม่ถูกต้อง' };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น' };
  const id = form.get('id');
  if (id && !idSchema.safeParse(id).success) return { error: 'ความคิดเห็นไม่ถูกต้อง' };
  const parentId = form.get('parent_id');
  if (parentId && !idSchema.safeParse(parentId).success)
    return { error: 'ความคิดเห็นต้นทางไม่ถูกต้อง' };
  const result = id
    ? await db
        .from('forum_comments')
        .update({ body: body.data })
        .eq('id', id)
        .eq('thread_id', threadId.data)
        .eq('author_id', user.id)
        .select('id')
        .maybeSingle()
    : await db
        .from('forum_comments')
        .insert({
          body: body.data,
          thread_id: threadId.data,
          parent_id: parentId || null,
          author_name: getUserDisplayName(user),
        })
        .select('id')
        .single();
  if (result.error || !result.data) return { error: 'บันทึกความคิดเห็นไม่สำเร็จ กรุณาลองอีกครั้ง' };
  revalidatePath(`/forum/${threadId.data}`);
  return { success: id ? 'แก้ไขความคิดเห็นแล้ว' : 'ส่งความคิดเห็นแล้ว' };
}

export async function deletePost(_: ForumActionState, form: FormData): Promise<ForumActionState> {
  const id = idSchema.safeParse(form.get('id'));
  const threadId = idSchema.safeParse(form.get('thread_id'));
  const isComment = form.get('kind') === 'comment';
  if (!id.success || (isComment && !threadId.success)) return { error: 'ข้อมูลไม่ถูกต้อง' };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' };
  const { data, error } = await db
    .from(isComment ? 'forum_comments' : 'forum_threads')
    .delete()
    .eq('id', id.data)
    .eq('author_id', user.id)
    .select(isComment ? 'id' : 'id,image_path')
    .maybeSingle();
  if (error || !data) return { error: 'ลบไม่สำเร็จ หรือคุณไม่มีสิทธิ์ลบโพสต์นี้' };
  revalidatePath('/forum');
  if (!isComment) {
    if ('image_path' in data && typeof data.image_path === 'string')
      await db.storage.from(FORUM_IMAGE_BUCKET).remove([data.image_path]);
    redirect('/forum');
  }
  revalidatePath(`/forum/${threadId.data}`);
  return { success: 'ลบความคิดเห็นแล้ว' };
}
