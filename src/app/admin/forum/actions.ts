'use server';

import type { ForumActionState } from 'src/app/forum/schema';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { idSchema } from 'src/app/forum/schema';
import { FORUM_IMAGE_BUCKET } from 'src/lib/supabase/forum-image';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

export async function moderateForum(
  _: ForumActionState,
  form: FormData
): Promise<ForumActionState> {
  const { supabase, user } = await requireAdminClient();
  if (!user) return { error: 'ไม่มีสิทธิ์จัดการกระทู้' };
  const id = idSchema.safeParse(form.get('id'));
  const threadId = idSchema.safeParse(form.get('thread_id'));
  const kind = form.get('kind');
  if (!id.success || !threadId.success || (kind !== 'thread' && kind !== 'comment'))
    return { error: 'ข้อมูลไม่ถูกต้อง' };
  if (kind === 'thread' && id.data !== threadId.data) return { error: 'ข้อมูลไม่ถูกต้อง' };
  const query = supabase
    .from(kind === 'thread' ? 'forum_threads' : 'forum_comments')
    .delete()
    .eq('id', id.data);
  const { data, error } = await (kind === 'comment' ? query.eq('thread_id', threadId.data) : query)
    .select(kind === 'thread' ? 'id,image_path' : 'id')
    .maybeSingle();
  if (error || !data) return { error: 'ลบไม่สำเร็จ หรือเนื้อหาถูกลบไปแล้ว' };
  if ('image_path' in data && typeof data.image_path === 'string')
    await supabase.storage.from(FORUM_IMAGE_BUCKET).remove([data.image_path]);
  revalidatePath('/admin/forum');
  revalidatePath(`/admin/forum/${threadId.data}`);
  revalidatePath('/forum');
  revalidatePath(`/forum/${threadId.data}`);
  if (kind === 'thread') return redirect('/admin/forum');
  return { success: 'ลบความคิดเห็นแล้ว' };
}

export async function setForumVisibility(
  _: ForumActionState,
  form: FormData
): Promise<ForumActionState> {
  const { supabase, user } = await requireAdminClient();
  if (!user) return { error: 'ไม่มีสิทธิ์จัดการกระทู้' };
  const id = idSchema.safeParse(form.get('id'));
  const threadId = idSchema.safeParse(form.get('thread_id'));
  const kind = form.get('kind');
  const hidden = form.get('hidden');
  if (
    !id.success ||
    !threadId.success ||
    !['thread', 'comment'].includes(String(kind)) ||
    !['true', 'false'].includes(String(hidden))
  )
    return { error: 'ข้อมูลไม่ถูกต้อง' };
  if (kind === 'thread' && id.data !== threadId.data) return { error: 'ข้อมูลไม่ถูกต้อง' };
  const query = supabase
    .from(kind === 'thread' ? 'forum_threads' : 'forum_comments')
    .update({ is_hidden: hidden === 'true' })
    .eq('id', id.data);
  const { data, error } = await (kind === 'comment' ? query.eq('thread_id', threadId.data) : query)
    .select('id')
    .maybeSingle();
  if (error || !data) return { error: 'เปลี่ยนการแสดงผลไม่สำเร็จ' };
  revalidatePath('/admin/forum');
  revalidatePath(`/admin/forum/${threadId.data}`);
  revalidatePath('/forum');
  revalidatePath(`/forum/${threadId.data}`);
  return { success: hidden === 'true' ? 'ซ่อนเนื้อหาแล้ว' : 'เลิกซ่อนเนื้อหาแล้ว' };
}
