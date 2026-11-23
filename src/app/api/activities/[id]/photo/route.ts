import { z } from 'zod';
import sharp from 'sharp';
import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';
import { getFlavorPollStatus } from 'src/lib/flavor-poll-schedule';
import {
  ACTIVITY_PHOTO_TYPES,
  ACTIVITY_PHOTO_BUCKET,
  ACTIVITY_PHOTO_MAX_BYTES,
  ACTIVITY_PHOTO_FILE_ERROR,
} from 'src/lib/activity-photo';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });

  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนส่งภาพ' }, { status: 401 });

  const { data: activity, error } = await db
    .from('flavor_polls')
    .select('is_active, starts_at, ends_at')
    .eq('id', id)
    .eq('activity_type', 'photo')
    .eq('is_published', true)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'โหลดกิจกรรมไม่สำเร็จ' }, { status: 500 });
  if (!activity || getFlavorPollStatus(activity) !== 'active') {
    return NextResponse.json({ error: 'กิจกรรมนี้ปิดรับภาพแล้ว' }, { status: 409 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('image');
  const submissionId = z.uuid().safeParse(form?.get('submissionId'));
  if (
    !submissionId.success ||
    !(file instanceof File) ||
    !file.size ||
    file.size > ACTIVITY_PHOTO_MAX_BYTES ||
    !ACTIVITY_PHOTO_TYPES.includes(file.type)
  ) {
    return NextResponse.json({ error: ACTIVITY_PHOTO_FILE_ERROR }, { status: 400 });
  }

  let content: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 });
    const { format } = await image.metadata();
    if (format !== 'jpeg' && format !== 'png' && format !== 'webp') {
      return NextResponse.json({ error: ACTIVITY_PHOTO_FILE_ERROR }, { status: 400 });
    }
    content = await image
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'อ่านไฟล์รูปภาพไม่สำเร็จ' }, { status: 422 });
  }

  const path = `${user.id}/${id}/${submissionId.data}.webp`;
  const bucket = db.storage.from(ACTIVITY_PHOTO_BUCKET);
  const upload = await bucket.upload(path, content, { contentType: 'image/webp' });
  if (upload.error && upload.error.status !== 409 && upload.error.statusCode !== '409')
    return NextResponse.json({ error: 'อัปโหลดรูปไม่สำเร็จ' }, { status: 500 });

  const submission = await db.rpc('submit_activity_photo', {
    target_activity_id: id,
    object_path: path,
  });
  if (submission.error) {
    if (!upload.error) await bucket.remove([path]);
    const closed = submission.error.code === '23514';
    return NextResponse.json(
      { error: closed ? 'กิจกรรมนี้ปิดรับภาพแล้ว' : 'บันทึกภาพไม่สำเร็จ' },
      { status: closed ? 409 : 500 }
    );
  }

  return new Response(new Uint8Array(content), {
    status: 201,
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' },
  });
}
