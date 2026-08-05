import type { ChipProps } from '@mui/material/Chip';
import type { StockStatus } from 'src/types/store';

import Chip from '@mui/material/Chip';

// ----------------------------------------------------------------------

const STATUS_CONFIG: Record<StockStatus, { label: string; color: ChipProps['color'] }> = {
  available: { label: 'มีสินค้า', color: 'success' },
  low_stock: { label: 'เหลือน้อย', color: 'warning' },
  out_of_stock: { label: 'สินค้าหมด', color: 'error' },
  unknown: { label: 'ยังไม่ยืนยัน', color: 'default' },
};

type StoreStatusChipProps = {
  status: StockStatus;
  size?: ChipProps['size'];
};

export function StoreStatusChip({ status, size = 'small' }: StoreStatusChipProps) {
  const config = STATUS_CONFIG[status];

  return <Chip label={config.label} color={config.color} size={size} variant="filled" />;
}
