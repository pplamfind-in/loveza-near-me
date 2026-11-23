import type { Metadata } from 'next';
import type { LatestStorePreview } from 'src/types/store';

import { createClient } from 'src/lib/supabase/server';
import { SITE_TITLE, SITE_DESCRIPTION, createSeoMetadata } from 'src/lib/seo';
import { DEFAULT_BRAND_OWNER_ACKNOWLEDGED } from 'src/lib/brand-owner-notice';

import { HomeView } from 'src/sections/home/view';
import { FlavorPollsSection } from 'src/sections/home/flavor-polls-section';
import { LimitedMissionsSection } from 'src/sections/home/limited-missions-section';

import { type LandingBanner, DEFAULT_LANDING_BANNERS } from 'src/types/landing-banner';
import { type LovezaProduct, DEFAULT_LOVEZA_PRODUCTS } from 'src/types/loveza-product';

// ----------------------------------------------------------------------

export const metadata: Metadata = createSeoMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
});

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [
    productsResult,
    likesResult,
    bannersResult,
    storesResult,
    acknowledgementResult,
    landingActivitiesResult,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('product_like_counts').select('product_id, like_count'),
    supabase
      .from('landing_banners')
      .select('id, title, image_url, mobile_image_url, alt_text, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('stores')
      .select('id, name, address, province, current_status, estimated_quantity, last_reported_at')
      .eq('is_active', true)
      .order('last_reported_at', { ascending: false, nullsFirst: false })
      .limit(2),
    supabase.rpc('get_brand_owner_acknowledged'),
    isDevelopment ? supabase.rpc('get_landing_activities_enabled') : null,
  ]);

  const catalog = productsResult.error
    ? DEFAULT_LOVEZA_PRODUCTS
    : ((productsResult.data ?? []) as LovezaProduct[]);
  const likeCounts = new Map(
    (likesResult.data ?? []).map(({ product_id, like_count }) => [product_id, Number(like_count)])
  );
  const products = likesResult.error
    ? catalog
    : catalog.map((product) => ({ ...product, like_count: likeCounts.get(product.id) ?? 0 }));
  const banners = bannersResult.error
    ? DEFAULT_LANDING_BANNERS
    : ((bannersResult.data ?? []) as LandingBanner[]);
  const latestStores = storesResult.error
    ? []
    : ((storesResult.data ?? []) as LatestStorePreview[]);
  const brandOwnerAcknowledged = acknowledgementResult.data ?? DEFAULT_BRAND_OWNER_ACKNOWLEDGED;

  return (
    <HomeView
      limitedMissions={<LimitedMissionsSection db={supabase} />}
      flavorPolls={
        isDevelopment && landingActivitiesResult?.data !== false ? (
          <FlavorPollsSection db={supabase} />
        ) : null
      }
      products={products}
      banners={banners}
      latestStores={latestStores}
      brandOwnerAcknowledged={brandOwnerAcknowledged}
    />
  );
}
