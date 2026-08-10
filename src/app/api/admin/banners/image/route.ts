import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  getLandingBannerImagePath,
  LANDING_BANNER_IMAGE_TYPES,
  LANDING_BANNER_IMAGE_BUCKET,
  MAX_LANDING_BANNER_IMAGE_SIZE,
} from 'src/lib/supabase/landing-banner-image';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const image = (await request.formData()).get('image');
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: 'กรุณาเลือกไฟล์รูป Banner' }, { status: 400 });
  }
  if (!LANDING_BANNER_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP' }, { status: 400 });
  }
  if (image.size > MAX_LANDING_BANNER_IMAGE_SIZE) {
    return NextResponse.json({ error: 'ไฟล์รูป Banner ต้องไม่เกิน 10MB' }, { status: 400 });
  }

  const path = `${user.id}/${randomUUID()}.${EXTENSIONS[image.type] ?? 'jpg'}`;
  const { error } = await supabase.storage
    .from(LANDING_BANNER_IMAGE_BUCKET)
    .upload(path, image, { contentType: image.type, upsert: false });

  if (error) return NextResponse.json({ error: 'อัปโหลดรูป Banner ไม่สำเร็จ' }, { status: 500 });

  const url = supabase.storage.from(LANDING_BANNER_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  const path = getLandingBannerImagePath(url);
  if (!path) return NextResponse.json({ error: 'URL รูป Banner ไม่ถูกต้อง' }, { status: 400 });

  const { error } = await supabase.storage.from(LANDING_BANNER_IMAGE_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: 'ลบรูป Banner ไม่สำเร็จ' }, { status: 500 });

  return NextResponse.json({ status: 'success' });
}
