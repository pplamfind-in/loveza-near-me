'use client';

import type { Report } from 'src/types/report';
import type { StockStatus } from 'src/types/store';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { formatReportDate } from 'src/utils/format-date';

import { STOCK_STATUS_OPTIONS } from 'src/validations/report.schema';

import { StoreStatusChip } from 'src/components/store/store-status-chip';

// ----------------------------------------------------------------------

type AdminReportItemProps = {
  report: Report;
  variant: 'pending' | 'approved' | 'rejected';
  busy?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onHide?: () => void;
  onChangeStatus?: (status: StockStatus) => void;
};

export function AdminReportItem({
  report,
  variant,
  busy,
  onApprove,
  onReject,
  onEdit,
  onHide,
  onChangeStatus,
}: AdminReportItemProps) {
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null);
  const location = [report.subdistrict, report.district, report.province]
    .filter(Boolean)
    .join(' ');

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="subtitle1" fontWeight={800}>
            {report.store_name}
          </Typography>
          <StoreStatusChip status={report.stock_status} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {location}
        </Typography>

        {report.flavor && (
          <Typography variant="body2" color="text.secondary">
            รสชาติ: {report.flavor}
          </Typography>
        )}

        {report.note && (
          <Typography variant="body2" color="text.secondary">
            หมายเหตุ: {report.note}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary">
          {formatReportDate(report.created_at)}
        </Typography>

        {report.photo_url && (
          <Stack
            component="img"
            src={report.photo_url}
            alt={report.store_name}
            sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2 }}
          />
        )}

        {variant === 'pending' && (
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="contained" color="success" onClick={onApprove} disabled={busy} fullWidth>
              อนุมัติ
            </Button>
            <Button variant="outlined" color="error" onClick={onReject} disabled={busy} fullWidth>
              ปฏิเสธ
            </Button>
          </Stack>
        )}

        {variant === 'approved' && report.store_id && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
            <Button size="small" variant="outlined" onClick={onEdit} disabled={busy}>
              แก้ไข
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={busy}
              onClick={(event) => setStatusMenuAnchor(event.currentTarget)}
            >
              เปลี่ยนสถานะสินค้า
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={onHide} disabled={busy}>
              ซ่อนข้อมูลผิด
            </Button>

            <Menu
              anchorEl={statusMenuAnchor}
              open={!!statusMenuAnchor}
              onClose={() => setStatusMenuAnchor(null)}
            >
              {STOCK_STATUS_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  onClick={() => {
                    onChangeStatus?.(option.value);
                    setStatusMenuAnchor(null);
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
