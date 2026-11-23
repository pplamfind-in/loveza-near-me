import type { Metadata } from 'next';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

import { FlavorPollForm } from 'src/sections/admin/flavor-poll-form';

import { getFlavorPollCardProducts } from '../card-products';

export const metadata: Metadata = { title: 'สร้างกิจกรรม | Loveza Admin' };

export default async function NewFlavorPollPage() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;
  const { products, error } = await getFlavorPollCardProducts(supabase);

  return <FlavorPollForm cardProducts={products} cardProductsError={error} />;
}
