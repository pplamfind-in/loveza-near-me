import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  getStoreTypeLogoPath,
  STORE_TYPE_LOGO_TYPES,
  STORE_TYPE_LOGO_BUCKET,
  MAX_STORE_TYPE_LOGO_SIZE,
} from 'src/lib/supabase/store-type-logo';

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
    return NextResponse.json({ error: 'กรุณาเลือกไฟล์ Logo' }, { status: 400 });
  }
  if (!STORE_TYPE_LOGO_TYPES.includes(image.type)) {
    return NextResponse.json({ error: 'รองรับ JPG, PNG หรือ WEBP' }, { status: 400 });
  }
  if (image.size > MAX_STORE_TYPE_LOGO_SIZE) {
    return NextResponse.json({ error: 'Logo ต้องมีขนาดไม่เกิน 2MB' }, { status: 400 });
  }

  const path = `${user.id}/${randomUUID()}.${EXTENSIONS[image.type] ?? 'png'}`;
  const { error } = await supabase.storage
    .from(STORE_TYPE_LOGO_BUCKET)
    .upload(path, image, { contentType: image.type, upsert: false });
  if (error) return NextResponse.json({ error: 'อัปโหลด Logo ไม่สำเร็จ' }, { status: 500 });

  const url = supabase.storage.from(STORE_TYPE_LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { url } = (await request.json()) as { url?: string };
  const path = getStoreTypeLogoPath(url);
  if (!path) return NextResponse.json({ error: 'URL Logo ไม่ถูกต้อง' }, { status: 400 });

  const { error } = await supabase.storage.from(STORE_TYPE_LOGO_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: 'ลบ Logo ไม่สำเร็จ' }, { status: 500 });
  return NextResponse.json({ status: 'success' });
}
