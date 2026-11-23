import type { createClient } from 'src/lib/supabase/server';

import { getProductFlavorIcon } from 'src/lib/product-flavor-icon';

export async function getFlavorPollCardProducts(db: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await db
    .from('products')
    .select('id, slug, thai_name, description, image_url, icon_url')
    .eq('is_active', true)
    .order('sort_order');

  return {
    products: (data ?? []).map((product) => ({
      id: String(product.id),
      label: String(product.thai_name).slice(0, 80),
      description: (product.description ?? '').slice(0, 500) as string,
      imageUrl: (product.image_url || getProductFlavorIcon(product) || '') as string,
    })),
    error: Boolean(error),
  };
}
