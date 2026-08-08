import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { productSchema } from 'src/app/admin/products/schema';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getProductImagePath, PRODUCT_IMAGE_BUCKET } from 'src/lib/supabase/product-image';

const PRODUCT_FIELDS =
  'id, name, thai_name, slug, description, image_url, color, accent, fruit, meta, sort_order, is_active, created_at, updated_at';

export async function GET() {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูลสินค้าไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...values,
      description: values.description || null,
      image_url: values.image_url || null,
    })
    .select(PRODUCT_FIELDS)
    .single();

  if (error?.code === '23505') {
    const imagePath = getProductImagePath(values.image_url);
    if (imagePath) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);
    return NextResponse.json({ error: 'slug นี้มีอยู่แล้ว' }, { status: 409 });
  }
  if (error) {
    const imagePath = getProductImagePath(values.image_url);
    if (imagePath) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);
    return NextResponse.json({ error: 'บันทึกสินค้าไม่สำเร็จ' }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return NextResponse.json({ product: data }, { status: 201 });
}
