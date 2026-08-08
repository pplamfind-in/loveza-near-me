import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  PRODUCT_IMAGE_TYPES,
  getProductImagePath,
  PRODUCT_IMAGE_BUCKET,
  MAX_PRODUCT_IMAGE_SIZE,
} from 'src/lib/supabase/product-image';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const formData = await request.formData();
  const image = formData.get('image');

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: 'กรุณาเลือกไฟล์รูปสินค้า' }, { status: 400 });
  }
  if (!PRODUCT_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP' }, { status: 400 });
  }
  if (image.size > MAX_PRODUCT_IMAGE_SIZE) {
    return NextResponse.json({ error: 'ไฟล์รูปต้องไม่เกิน 5MB' }, { status: 400 });
  }

  const path = `${user.id}/${randomUUID()}.${EXTENSIONS[image.type] ?? 'jpg'}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, image, { contentType: image.type, upsert: false });

  if (error) return NextResponse.json({ error: 'อัปโหลดรูปสินค้าไม่สำเร็จ' }, { status: 500 });

  const url = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;

  return NextResponse.json({ url });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { url } = (await request.json()) as { url?: string };
  const path = getProductImagePath(url);
  if (!path) return NextResponse.json({ error: 'URL รูปสินค้าไม่ถูกต้อง' }, { status: 400 });

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: 'ลบรูปสินค้าไม่สำเร็จ' }, { status: 500 });

  return NextResponse.json({ status: 'success' });
}
