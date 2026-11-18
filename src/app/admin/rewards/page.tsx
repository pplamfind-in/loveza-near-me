import type { Metadata } from 'next';
import type { ExplorerReward } from 'src/lib/explorer/rewards';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getRewardCharacters } from 'src/lib/explorer/reward-catalog';

import { RewardsPanel } from 'src/sections/admin/rewards-panel';

export const metadata: Metadata = { title: 'รางวัลนักสำรวจ | Loveza Admin' };
export default async function RewardsAdminPage() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;
  const [{ data, error }, characters, rules, products] = await Promise.all([
    supabase.from('explorer_rewards').select('*').order('sort_order').order('id'),
    getRewardCharacters(),

    supabase.from('explorer_reward_rules').select('*').order('sort_order').order('id'),
    supabase.from('products').select('id, thai_name, slug, is_new, is_active').order('sort_order'),
  ]);
  return (
    <DashboardContent maxWidth="xl">
      <RewardsPanel
        rewards={(data ?? []) as ExplorerReward[]}
        characters={characters}
        rules={rules.data ?? []}
        products={products.data ?? []}
        hasError={Boolean(error || rules.error || products.error)}
      />
    </DashboardContent>
  );
}
