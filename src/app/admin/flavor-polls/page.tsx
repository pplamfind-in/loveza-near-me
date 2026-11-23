import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import {
  formatBangkokPollDate,
  getFlavorPollPublicationStatus,
} from 'src/lib/flavor-poll-schedule';

import { FlavorPollsPanel } from 'src/sections/admin/flavor-polls-panel';

export const metadata: Metadata = { title: 'กิจกรรม | Loveza Admin' };

export default async function FlavorPollsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;

  const [{ status }, polls, totals] = await Promise.all([
    searchParams,
    supabase
      .from('flavor_polls')
      .select('id, title, options, activity_type, is_active, is_published, starts_at, ends_at')
      .order('created_at', { ascending: false }),
    supabase.rpc('get_flavor_poll_totals'),
  ]);
  const counts = new Map<string, Map<string, number>>();
  for (const row of totals.data ?? []) {
    const pollCounts = counts.get(row.poll_id) ?? new Map<string, number>();
    pollCounts.set(row.option_label, Number(row.vote_count));
    counts.set(row.poll_id, pollCounts);
  }

  return (
    <DashboardContent maxWidth="xl">
      <FlavorPollsPanel
        polls={(polls.data ?? []).map((poll) => ({
          id: poll.id,
          title: poll.title,
          type: poll.activity_type,
          active: poll.is_active,
          status: getFlavorPollPublicationStatus(poll),
          startsAt: poll.starts_at ? formatBangkokPollDate(poll.starts_at) : null,
          endsAt: poll.ends_at ? formatBangkokPollDate(poll.ends_at) : null,
          options: (poll.options as string[]).map((label) => ({
            label,
            votes: counts.get(poll.id)?.get(label) ?? 0,
          })),
        }))}
        status={status}
        pollsError={Boolean(polls.error)}
        totalsError={Boolean(totals.error)}
      />
    </DashboardContent>
  );
}
