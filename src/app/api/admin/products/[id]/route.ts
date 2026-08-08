import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { productSchema } from 'src/app/admin/products/schema';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getProductImagePath, PRODUCT_IMAGE_BUCKET } from 'src/lib/supabase/product-image';

const PRODUCT_FIELDS =
  'id, name, thai_name, slug, description, image_url, color, accent, fruit, meta, sort_order, is_active, created_at, updated_at';

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: ProductRouteContext) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const [{ id }, body] = await Promise.all([params, request.json()]);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูลสินค้าไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const values = parsed.data;
  const { data: currentProduct, error: currentProductError } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .single();

  if (currentProductError) {
    return NextResponse.json({ error: 'ไม่พบสินค้าที่ต้องการแก้ไข' }, { status: 404 });
  }

  const oldImagePath = getProductImagePath(currentProduct.image_url);
  const newImagePath = getProductImagePath(values.image_url);
  const { data, error } = await supabase
    .from('products')
    .update({
      ...values,
      description: values.description || null,
      image_url: values.image_url || null,
    })
    .eq('id', id)
    .select(PRODUCT_FIELDS)
    .single();

  if (error?.code === '23505') {
    if (newImagePath && newImagePath !== oldImagePath) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([newImagePath]);
    }
    return NextResponse.json({ error: 'slug นี้มีอยู่แล้ว' }, { status: 409 });
  }
  if (error) {
    if (newImagePath && newImagePath !== oldImagePath) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([newImagePath]);
    }
    return NextResponse.json({ error: 'แก้ไขสินค้าไม่สำเร็จ' }, { status: 500 });
  }

  if (oldImagePath && oldImagePath !== newImagePath) {
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([oldImagePath]);
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return NextResponse.json({ product: data });
}

export async function DELETE(_request: Request, { params }: ProductRouteContext) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .single();

  if (productError) {
    return NextResponse.json({ error: 'ไม่พบสินค้าที่ต้องการลบ' }, { status: 404 });
  }

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) return NextResponse.json({ error: 'ลบสินค้าไม่สำเร็จ' }, { status: 500 });

  const imagePath = getProductImagePath(product.image_url);
  if (imagePath) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);

  revalidatePath('/');
  revalidatePath('/admin/products');

  return NextResponse.json({ status: 'success' });
}
