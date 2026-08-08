import type { StoreStatus } from './store';

// ----------------------------------------------------------------------

export const FLAVOR_OPTIONS = [
  { value: 'honey_lemon', label: 'Honey Lemon' },
  { value: 'lychee', label: 'Lychee' },
  { value: 'kyoho_grape', label: 'Kyoho Grape' },
  { value: 'unknown', label: 'ไม่แน่ใจ' },
] as const;

export type FlavorValue = (typeof FLAVOR_OPTIONS)[number]['value'];

export type ReportStockStatus = StoreStatus;
