import type { StoreWithDistance } from 'src/types/store';

import Link from 'next/link';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MapRounded from '@mui/icons-material/MapRounded';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';

import { formatDistance } from 'src/utils/format-distance';
import { formatRelativeDate } from 'src/utils/format-date';
import { getGoogleMapsUrl } from 'src/utils/google-maps-url';

import { StoreStatusChip } from './store-status-chip';

// ----------------------------------------------------------------------

type StoreCardProps = {
  store: StoreWithDistance;
  flavor?: string | null;
};

export function StoreCard({ store, flavor }: StoreCardProps) {
  const location = [store.subdistrict, store.district, store.province].filter(Boolean).join(' ');

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="subtitle1" fontWeight={800}>
            {store.name}
          </Typography>
          <StoreStatusChip status={store.current_status} />
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
          <PlaceOutlined fontSize="small" />
          <Typography variant="body2">{location || store.province}</Typography>
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Typography variant="body2" color="text.secondary">
            {formatDistance(store.distanceKm)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatRelativeDate(store.last_reported_at)}
          </Typography>
        </Stack>

        {flavor && (
          <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
            <LocalDrinkRounded fontSize="small" />
            <Typography variant="body2">{flavor}</Typography>
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <Button component={Link} href={`/store/${store.id}`} variant="contained" fullWidth>
            ดูรายละเอียด
          </Button>
          <Button
            component="a"
            href={getGoogleMapsUrl(store.latitude, store.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            startIcon={<MapRounded />}
            sx={{ flexShrink: 0 }}
          >
            แผนที่
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
