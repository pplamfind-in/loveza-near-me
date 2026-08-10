'use client';

import type { VercelAnalyticsData } from 'src/lib/vercel/analytics';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

type AdminAnalyticsViewProps = {
  analytics: VercelAnalyticsData;
};

const PERIODS = [
  { value: 7, label: '7 วัน' },
  { value: 30, label: '30 วัน' },
  { value: 90, label: '90 วัน' },
] as const;

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'คอมพิวเตอร์',
  mobile: 'มือถือ',
  tablet: 'แท็บเล็ต',
};

function MetricList({
  title,
  rows,
  emptyText,
  translateName,
}: {
  title: string;
  rows: VercelAnalyticsData['topPages'];
  emptyText: string;
  translateName?: (name: string) => string;
}) {
  const maxPageviews = Math.max(...rows.map((row) => row.pageviews), 1);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{title}</Typography>
      <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
        {rows.length ? (
          rows.map((row) => (
            <Box key={row.name} sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography noWrap sx={{ minWidth: 0, fontSize: 13, fontWeight: 700 }}>
                  {translateName?.(row.name) ?? row.name}
                </Typography>
                <Typography sx={{ flexShrink: 0, color: 'text.secondary', fontSize: 12 }}>
                  {row.pageviews.toLocaleString('th-TH')} ครั้ง
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(row.pageviews / maxPageviews) * 100}
                sx={{ mt: 1, height: 5, borderRadius: 99 }}
              />
            </Box>
          ))
        ) : (
          <Typography sx={{ py: 4, color: 'text.secondary', textAlign: 'center', fontSize: 13 }}>
            {emptyText}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export function AdminAnalyticsView({ analytics }: AdminAnalyticsViewProps) {
  const averageViews = analytics.visitors
    ? (analytics.pageviews / analytics.visitors).toFixed(1)
    : '0.0';
  const chartOptions = useChart({
    colors: ['#e5007e', '#00a99d'],
    xaxis: {
      categories: analytics.timeline.map((item) =>
        new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(
          new Date(item.date)
        )
      ),
    },
    stroke: { curve: 'smooth', width: 3 },
    tooltip: { shared: true, intersect: false },
  });

  const summaryCards = [
    {
      label: 'การเปิดหน้าเว็บ',
      value: analytics.pageviews.toLocaleString('th-TH'),
      suffix: 'ครั้ง',
      icon: 'ri:pages-fill',
      color: '#e5007e',
      background: '#fff0f7',
    },
    {
      label: 'ผู้เข้าชม',
      value: analytics.visitors.toLocaleString('th-TH'),
      suffix: 'คน',
      icon: 'ri:user-heart-fill',
      color: '#008f84',
      background: '#e9fbf8',
    },
    {
      label: 'หน้าเฉลี่ยต่อคน',
      value: averageViews,
      suffix: 'หน้า',
      icon: 'ri:bar-chart-box-fill',
      color: '#6d3b8c',
      background: '#f6effa',
    },
  ];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            VERCEL WEB ANALYTICS
          </Typography>
          <Typography
            component="h1"
            sx={{ mt: 0.75, fontSize: { xs: 30, md: 38 }, fontWeight: 900 }}
          >
            สถิติการเข้าใช้งาน
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            ข้อมูลผู้เข้าชมเว็บไซต์จริงจาก Vercel อัปเดตอัตโนมัติทุก 5 นาที
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              component={Link}
              href={`/admin/analytics?period=${item.value}`}
              variant={analytics.period === item.value ? 'contained' : 'outlined'}
              sx={{ minWidth: 76, borderRadius: 99 }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Stack>

      {analytics.error ? (
        <Alert severity={analytics.configured ? 'error' : 'warning'}>
          <Typography sx={{ fontWeight: 800 }}>ยังแสดงข้อมูลจาก Vercel ไม่ได้</Typography>
          <Typography variant="body2">{analytics.error}</Typography>
          {!analytics.configured ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              เพิ่มตัวแปร Server Environment: VERCEL_TOKEN, VERCEL_ANALYTICS_PROJECT_ID และ
              VERCEL_ANALYTICS_TEAM_ID แล้ว deploy ใหม่
            </Typography>
          ) : null}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {summaryCards.map((card) => (
          <Paper key={card.label} elevation={0} sx={{ p: 2.5, borderRadius: 3 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                color: card.color,
                display: 'grid',
                borderRadius: 2,
                placeItems: 'center',
                bgcolor: card.background,
              }}
            >
              <Iconify icon={card.icon} width={25} />
            </Box>
            <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 13 }}>
              {card.label}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 28, fontWeight: 900 }}>
              {card.value}{' '}
              <Typography component="span" sx={{ color: 'text.secondary', fontSize: 13 }}>
                {card.suffix}
              </Typography>
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 900 }}>แนวโน้มการเข้าใช้งาน</Typography>
        <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
          จำนวนการเปิดหน้าและผู้เข้าชมแยกรายวัน
        </Typography>
        {analytics.timeline.length ? (
          <Chart
            type="area"
            options={chartOptions}
            series={[
              { name: 'เปิดหน้าเว็บ', data: analytics.timeline.map((item) => item.pageviews) },
              { name: 'ผู้เข้าชม', data: analytics.timeline.map((item) => item.visitors) },
            ]}
            sx={{ mt: 2, height: 340 }}
          />
        ) : (
          <Box sx={{ py: 10, color: 'text.secondary', textAlign: 'center' }}>
            ยังไม่มีข้อมูลในช่วงเวลานี้
          </Box>
        )}
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <MetricList
          title="หน้ายอดนิยม"
          rows={analytics.topPages}
          emptyText="ยังไม่มีข้อมูลหน้าเว็บ"
        />
        <MetricList
          title="แหล่งที่มา"
          rows={analytics.referrers}
          emptyText="ยังไม่มีข้อมูลแหล่งที่มา"
        />
        <MetricList
          title="อุปกรณ์"
          rows={analytics.devices}
          emptyText="ยังไม่มีข้อมูลอุปกรณ์"
          translateName={(name) => DEVICE_LABELS[name.toLowerCase()] ?? name}
        />
      </Box>
    </Stack>
  );
}
