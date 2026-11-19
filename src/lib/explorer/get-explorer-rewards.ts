import type { ExplorerReward } from './rewards';
import type { createClient } from 'src/lib/supabase/server';

import { sortRewardsForDisplay } from './rewards';
import { buildExplorerProgress } from './progress';

export async function getExplorerRewards(db: Awaited<ReturnType<typeof createClient>>) {
  const reportsForUser = async () => {
    const {
      data: { user },
    } = await db.auth.getUser();
    const { data, error } = user
      ? await db
          .from('reports')
          .select('store_id, approval_status, province, created_at, flavors, stock_status')
          .eq('reporter_id', user.id)
      : { data: null, error: null };
    return { user, reports: data, error };
  };

  const [{ user, reports, error }, { data: rewardRows, error: rewardsError }] = await Promise.all([
    reportsForUser(),
    db
      .from('explorer_rewards')
      .select('*, rule:explorer_reward_rules(*)')
      .eq('is_active', true)
      .order('sort_order')
      .order('id'),
  ]);
  const rewards = sortRewardsForDisplay((rewardRows ?? []) as ExplorerReward[]);
  const progress = user && !error ? buildExplorerProgress(reports ?? []) : null;

  return { user, rewards, progress, reports: reports ?? [], error, rewardsError };
}
