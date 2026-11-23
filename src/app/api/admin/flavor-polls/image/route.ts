import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { FLAVOR_POLL_IMAGE_BUCKET, MAX_FLAVOR_POLL_IMAGE_BYTES } from 'src/lib/flavor-poll-options';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const image = form?.get('image');
  const maxDimension = form?.get('purpose') === 'background' ? 1920 : 1200;
  if (
    !(image instanceof File) ||
    !image.size ||
    image.size > MAX_FLAVOR_POLL_IMAGE_BYTES ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)
  ) {
    return NextResponse.json(
      { error: 'เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 4 MB' },
      { status: 400 }
    );
  }

  let content: Buffer;
  try {
    content = await sharp(Buffer.from(await image.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'อ่านไฟล์รูปภาพไม่สำเร็จ' }, { status: 422 });
  }

  const bucket = supabase.storage.from(FLAVOR_POLL_IMAGE_BUCKET);
  const path = `${user.id}/${randomUUID()}.webp`;
  const { error } = await bucket.upload(path, content, { contentType: 'image/webp' });
  if (error) return NextResponse.json({ error: 'อัปโหลดรูปตัวเลือกไม่สำเร็จ' }, { status: 500 });

  return NextResponse.json({ url: bucket.getPublicUrl(path).data.publicUrl });
}
