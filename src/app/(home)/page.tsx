import type { Metadata } from 'next';

import { createClient } from 'src/lib/supabase/server';

import { HomeView } from 'src/sections/home/view';

import { type LovezaProduct, DEFAULT_LOVEZA_PRODUCTS } from 'src/types/loveza-product';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Loveza Near Me — ตามหาร้าน Loveza ใกล้คุณ',
  description:
    'ค้นหาร้านที่มี Loveza ใกล้คุณด้วย GPS ดูสถานะสินค้า และช่วยแจ้งพิกัดที่พบผ่านข้อมูลจาก Community',
};

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, thai_name, slug, description, image_url, color, accent, fruit, meta, sort_order, is_active'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const products = error ? DEFAULT_LOVEZA_PRODUCTS : ((data ?? []) as LovezaProduct[]);

  return <HomeView products={products} />;
}
