import type { Metadata } from 'next';
import type { AnalyticsPeriod } from 'src/lib/vercel/analytics';

import { DashboardContent } from 'src/layouts/dashboard';
import { getVercelAnalytics } from 'src/lib/vercel/analytics';

import { AdminAnalyticsView } from 'src/sections/admin/admin-analytics-view';

export const metadata: Metadata = { title: 'สถิติการเข้าใช้งาน | Loveza Admin' };

type AdminAnalyticsPageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const params = await searchParams;
  const requestedPeriod = Number(params.period);
  const period: AnalyticsPeriod =
    requestedPeriod === 7 || requestedPeriod === 90 ? requestedPeriod : 30;
  const analytics = await getVercelAnalytics(period);

  return (
    <DashboardContent maxWidth="xl">
      <AdminAnalyticsView analytics={analytics} />
    </DashboardContent>
  );
}
