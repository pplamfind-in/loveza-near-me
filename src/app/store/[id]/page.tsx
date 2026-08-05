import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';

import { formatReportDate } from 'src/utils/format-date';

import { CONFIG } from 'src/global-config';
import { createClient } from 'src/lib/supabase/server';
import { getStoreById } from 'src/services/stores.service';
import { getLatestApprovedReportForStore } from 'src/services/reports.service';

import { MobileHeader } from 'src/components/layout/mobile-header';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';
import { StoreStatusChip } from 'src/components/store/store-status-chip';
import { StoreQuickActions } from 'src/components/store/store-quick-actions';

// ----------------------------------------------------------------------

type StorePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const store = await getStoreById(supabase, id).catch(() => null);

  return { title: store ? `${store.name} | ${CONFIG.appName}` : CONFIG.appName };
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const store = await getStoreById(supabase, id).catch(() => null);

  if (!store) notFound();

  const latestReport = await getLatestApprovedReportForStore(supabase, store.id).catch(() => null);
  const location = [store.subdistrict, store.district, store.province].filter(Boolean).join(' ');

  return (
    <MobileAppShell>
      <MobileHeader title="รายละเอียดร้าน" showBack />

      <Stack spacing={2.5}>
        {latestReport?.photo_url && (
          <Stack
            component="img"
            src={latestReport.photo_url}
            alt={store.name}
            sx={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 4 }}
          />
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="h5" fontWeight={800}>
            {store.name}
          </Typography>
          <StoreStatusChip status={store.current_status} size="medium" />
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="flex-start" color="text.secondary">
          <PlaceOutlined fontSize="small" sx={{ mt: 0.25 }} />
          <Typography variant="body2">{store.address || location}</Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          พิกัด: {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}
        </Typography>

        {latestReport?.flavor && (
          <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
            <LocalDrinkRounded fontSize="small" />
            <Typography variant="body2">รสชาติที่พบ: {latestReport.flavor}</Typography>
          </Stack>
        )}

        <Typography variant="body2" color="text.secondary">
          {formatReportDate(store.last_reported_at)}
        </Typography>

        {latestReport?.note && (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={700}>
              หมายเหตุ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {latestReport.note}
            </Typography>
          </Stack>
        )}

        <Divider />

        <StoreQuickActions store={store} />
      </Stack>
    </MobileAppShell>
  );
}
