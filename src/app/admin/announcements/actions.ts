'use server';

import { z } from 'zod';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { ANNOUNCEMENT_BUCKET } from 'src/lib/announcements';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';

import { announcementSchema, hasAnnouncementContent } from './schema';

const adminPath = '/admin/announcements';

function refreshAnnouncements(id: string) {
  revalidatePath(adminPath);
  revalidatePath('/announcements');
  revalidatePath(`/announcements/${id}`);
  revalidatePath('/');
}

export async function saveAnnouncement(id: string | null, form: FormData) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return 'บัญชีนี้ไม่มีสิทธิ์จัดการประกาศ';
  if (id !== null && !z.uuid().safeParse(id).success) return 'ไม่พบประกาศ';

  const parsed = announcementSchema.safeParse({
    title: form.get('title'),
    content: form.get('content'),
    publicationMode: form.get('publicationMode'),
    publishDate: form.get('publishDate') ?? '',
    cover: form.get('cover'),
    removeCover: form.get('removeCover') === 'true',
  });
  if (!parsed.success) return parsed.error.issues[0].message;

  const { title, publicationMode, publishDate, cover, removeCover } = parsed.data;
  const content = sanitizeFlavorPollDescription(parsed.data.content);
  if (publicationMode !== 'draft' && !hasAnnouncementContent(content)) {
    return 'กรุณากรอกรายละเอียดประกาศ';
  }

  const bucket = supabase.storage.from(ANNOUNCEMENT_BUCKET);
  let oldCover: string | null = null;
  let oldPublishAt: string | null = null;
  if (id) {
    const { data, error } = await supabase
      .from('system_announcements')
      .select('cover_path, publish_at')
      .eq('id', id)
      .single();
    if (error) return 'โหลดประกาศไม่สำเร็จ';
    oldCover = data.cover_path;
    oldPublishAt = data.publish_at;
  }

  let newCover: string | null = null;
  if (cover) {
    let image: Buffer;
    try {
      image = await sharp(Buffer.from(await cover.arrayBuffer()), { limitInputPixels: 24_000_000 })
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer();
    } catch {
      return 'เปิดรูปภาพไม่ได้ กรุณาเลือกไฟล์ใหม่';
    }

    newCover = `${randomUUID()}.webp`;
    const { error } = await bucket.upload(newCover, image, { contentType: 'image/webp' });
    if (error) return 'อัปโหลดรูปภาพไม่สำเร็จ';
  }

  const now = new Date();
  let publishAt: string | null = null;
  if (publicationMode === 'scheduled') publishAt = `${publishDate}T00:00:00+07:00`;
  if (publicationMode === 'immediate') {
    publishAt =
      oldPublishAt && Date.parse(oldPublishAt) <= now.getTime() ? oldPublishAt : now.toISOString();
  }
  const changes = {
    title,
    content_html: content,
    publish_at: publishAt,
    updated_at: now.toISOString(),
    ...(newCover || removeCover ? { cover_path: newCover } : {}),
  };
  const table = supabase.from('system_announcements');
  let query = id ? table.update(changes).eq('id', id) : table.insert(changes);
  if (id && (newCover || removeCover)) {
    query = oldCover ? query.eq('cover_path', oldCover) : query.is('cover_path', null);
  }

  const { data, error } = await query.select('id').single();
  if (error || !data) {
    if (newCover) await bucket.remove([newCover]);
    return 'บันทึกประกาศไม่สำเร็จ กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง';
  }

  if (oldCover && (newCover || removeCover)) await bucket.remove([oldCover]);
  refreshAnnouncements(data.id);
  return redirect(adminPath);
}

export async function deleteAnnouncement(id: string) {
  const { supabase, user } = await requireAdminClient();
  if (!user || !z.uuid().safeParse(id).success) return 'ไม่มีสิทธิ์ลบประกาศนี้';

  const { data, error } = await supabase
    .from('system_announcements')
    .delete()
    .eq('id', id)
    .select('cover_path')
    .single();
  if (error || !data) return 'ลบประกาศไม่สำเร็จ';
  if (data.cover_path) await supabase.storage.from(ANNOUNCEMENT_BUCKET).remove([data.cover_path]);

  refreshAnnouncements(id);
  return null;
}
