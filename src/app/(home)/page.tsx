import type { Metadata } from 'next';

import { createClient } from 'src/lib/supabase/server';
import { SITE_DESCRIPTION, createSeoMetadata } from 'src/lib/seo';

import { HomeView } from 'src/sections/home/view';

import { type LovezaProduct, DEFAULT_LOVEZA_PRODUCTS } from 'src/types/loveza-product';

// ----------------------------------------------------------------------

export const metadata: Metadata = createSeoMetadata({
  title: 'Loveza Near Me — ตามหาร้าน Loveza ใกล้คุณ',
  description: SITE_DESCRIPTION,
  path: '/',
});

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
