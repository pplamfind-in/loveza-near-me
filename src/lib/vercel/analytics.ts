export type AnalyticsPeriod = 7 | 30 | 90;

export type AnalyticsMetricRow = {
  name: string;
  pageviews: number;
  visitors: number;
};

export type AnalyticsTimelineRow = {
  date: string;
  pageviews: number;
  visitors: number;
};

export type VercelAnalyticsData = {
  configured: boolean;
  period: AnalyticsPeriod;
  since: string;
  until: string;
  pageviews: number;
  visitors: number;
  timeline: AnalyticsTimelineRow[];
  topPages: AnalyticsMetricRow[];
  referrers: AnalyticsMetricRow[];
  devices: AnalyticsMetricRow[];
  error: string | null;
};

type VercelAggregateResponse = {
  data?: Record<string, unknown>[];
};

const API_URL = 'https://api.vercel.com/v1/query/web-analytics/visits';

function emptyAnalytics(period: AnalyticsPeriod, error: string, configured = false) {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (period - 1));
  since.setUTCHours(0, 0, 0, 0);

  return {
    configured,
    period,
    since: since.toISOString(),
    until: until.toISOString(),
    pageviews: 0,
    visitors: 0,
    timeline: [],
    topPages: [],
    referrers: [],
    devices: [],
    error,
  } satisfies VercelAnalyticsData;
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mapDimensionRows(rows: Record<string, unknown>[], dimension: string) {
  return rows.map((row) => ({
    name: typeof row[dimension] === 'string' && row[dimension] ? row[dimension] : 'ไม่ระบุ',
    pageviews: getNumber(row.pageviews),
    visitors: getNumber(row.visitors),
  }));
}

async function fetchAnalytics<T>(path: string, params: URLSearchParams, token: string) {
  const response = await fetch(`${API_URL}/${path}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      message?: string;
    } | null;
    throw new Error(payload?.error?.message ?? payload?.message ?? `Vercel API ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getVercelAnalytics(period: AnalyticsPeriod): Promise<VercelAnalyticsData> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID ?? process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID ?? process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return emptyAnalytics(
      period,
      'ยังไม่ได้ตั้งค่า VERCEL_TOKEN และ VERCEL_ANALYTICS_PROJECT_ID สำหรับอ่านสถิติ'
    );
  }

  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (period - 1));
  since.setUTCHours(0, 0, 0, 0);

  const baseParams = new URLSearchParams({
    projectId,
    since: since.toISOString(),
    until: until.toISOString(),
  });
  if (teamId) baseParams.set('teamId', teamId);

  const aggregateParams = (by: string, limit = 10) => {
    const params = new URLSearchParams(baseParams);
    params.set('by', by);
    params.set('limit', String(limit));
    return params;
  };

  try {
    const [timeline, pages, referrers, devices] = await Promise.all([
      fetchAnalytics<VercelAggregateResponse>('aggregate', aggregateParams('day', period), token),
      fetchAnalytics<VercelAggregateResponse>('aggregate', aggregateParams('requestPath'), token),
      fetchAnalytics<VercelAggregateResponse>(
        'aggregate',
        aggregateParams('referrerHostname'),
        token
      ),
      fetchAnalytics<VercelAggregateResponse>('aggregate', aggregateParams('deviceType'), token),
    ]);

    const timelineRows = (timeline.data ?? []).map((row) => ({
      date: typeof row.timestamp === 'string' ? row.timestamp : '',
      pageviews: getNumber(row.pageviews),
      visitors: getNumber(row.visitors),
    }));

    return {
      configured: true,
      period,
      since: since.toISOString(),
      until: until.toISOString(),
      pageviews: timelineRows.reduce((total, row) => total + row.pageviews, 0),
      visitors: timelineRows.reduce((total, row) => total + row.visitors, 0),
      timeline: timelineRows,
      topPages: mapDimensionRows(pages.data ?? [], 'requestPath'),
      referrers: mapDimensionRows(referrers.data ?? [], 'referrerHostname'),
      devices: mapDimensionRows(devices.data ?? [], 'deviceType'),
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'โหลดข้อมูลจาก Vercel ไม่สำเร็จ';
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Failed to load Vercel Web Analytics',
        projectId,
        period,
        error: message,
      })
    );
    return emptyAnalytics(period, message, true);
  }
}
