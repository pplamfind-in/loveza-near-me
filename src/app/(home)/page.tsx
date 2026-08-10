import type { Metadata } from 'next';
import type { LatestStorePreview } from 'src/types/store';

import { createClient } from 'src/lib/supabase/server';
import { SITE_DESCRIPTION, createSeoMetadata } from 'src/lib/seo';

import { HomeView } from 'src/sections/home/view';

import { type LandingBanner, DEFAULT_LANDING_BANNERS } from 'src/types/landing-banner';
import { type LovezaProduct, DEFAULT_LOVEZA_PRODUCTS } from 'src/types/loveza-product';

// ----------------------------------------------------------------------

export const metadata: Metadata = createSeoMetadata({
  title: 'Loveza Hunt — ตามหาร้าน Loveza ใกล้คุณ',
  description: SITE_DESCRIPTION,
  path: '/',
});

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const [productsResult, bannersResult, storesResult] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, thai_name, slug, description, image_url, color, accent, fruit, meta, sort_order, is_active'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('landing_banners')
      .select('id, title, image_url, mobile_image_url, alt_text, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('stores')
      .select(
        'id, name, address, province, current_status, estimated_quantity, last_reported_at'
      )
      .eq('is_active', true)
      .order('last_reported_at', { ascending: false, nullsFirst: false })
      .limit(2),
  ]);

  const products = productsResult.error
    ? DEFAULT_LOVEZA_PRODUCTS
    : ((productsResult.data ?? []) as LovezaProduct[]);
  const banners = bannersResult.error
    ? DEFAULT_LANDING_BANNERS
    : ((bannersResult.data ?? []) as LandingBanner[]);
  const latestStores = storesResult.error
    ? []
    : ((storesResult.data ?? []) as LatestStorePreview[]);

  return <HomeView products={products} banners={banners} latestStores={latestStores} />;
}
