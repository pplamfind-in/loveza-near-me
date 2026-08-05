import type { Report } from 'src/types/report';

import Link from 'next/link';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';

import { formatReportDate } from 'src/utils/format-date';

import { StoreStatusChip } from './store-status-chip';

// ----------------------------------------------------------------------

type ReportCardProps = {
  report: Report;
};

export function ReportCard({ report }: ReportCardProps) {
  const location = [report.subdistrict, report.district, report.province]
    .filter(Boolean)
    .join(' ');

  const content = (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="subtitle1" fontWeight={800}>
            {report.store_name}
          </Typography>
          <StoreStatusChip status={report.stock_status} />
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
          <PlaceOutlined fontSize="small" />
          <Typography variant="body2">{location || report.province}</Typography>
        </Stack>

        {report.flavor && (
          <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
            <LocalDrinkRounded fontSize="small" />
            <Typography variant="body2">{report.flavor}</Typography>
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary">
          {formatReportDate(report.created_at)}
        </Typography>
      </Stack>
    </Card>
  );

  if (!report.store_id) return content;

  return (
    <Link href={`/store/${report.store_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {content}
    </Link>
  );
}
