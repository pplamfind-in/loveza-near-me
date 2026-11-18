import type { RewardRule } from 'src/lib/explorer/reward-rules';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

import { RewardRulesPanel } from 'src/sections/admin/reward-rules-panel';

export const metadata = { title: 'Master เงื่อนไขรางวัล | Loveza Admin' };
export default async function Page() {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;
  const { data, error } = await supabase
    .from('explorer_reward_rules')
    .select('*')
    .order('sort_order')
    .order('id');
  return (
    <DashboardContent maxWidth="xl">
      <RewardRulesPanel rules={(data ?? []) as RewardRule[]} hasError={Boolean(error)} />
    </DashboardContent>
  );
}
