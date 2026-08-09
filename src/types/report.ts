import type { StoreStatus } from './store';

// ----------------------------------------------------------------------

export const FLAVOR_OPTIONS = [
  { value: 'honey_lemon', label: 'Honey Lemon' },
  { value: 'lychee', label: 'Lychee' },
  { value: 'kyoho_grape', label: 'Kyoho Grape' },
  { value: 'unknown', label: 'ไม่แน่ใจ' },
] as const;

export const STORE_TYPE_VALUES = [
  'general',
  'seven_eleven',
  'cj_more',
  'lotus_go_fresh',
  'mini_big_c',
  'tops_daily',
  'other',
  'unknown',
] as const;

export const STORE_TYPE_OPTIONS = [
  { value: 'general', label: 'ร้านทั่วไป' },
  { value: 'seven_eleven', label: '7-Eleven' },
  { value: 'cj_more', label: 'CJ MORE' },
  { value: 'lotus_go_fresh', label: "Lotus’s go fresh" },
  { value: 'mini_big_c', label: 'Mini Big C' },
  { value: 'tops_daily', label: 'Tops Daily' },
  { value: 'other', label: 'ร้านประเภทอื่น' },
] as const;

export const STORE_TYPE_LABEL: Record<(typeof STORE_TYPE_VALUES)[number], string> = {
  general: 'ร้านทั่วไป',
  seven_eleven: '7-Eleven',
  cj_more: 'CJ MORE',
  lotus_go_fresh: "Lotus’s go fresh",
  mini_big_c: 'Mini Big C',
  tops_daily: 'Tops Daily',
  other: 'ร้านประเภทอื่น',
  unknown: 'ไม่ระบุประเภท',
};

export type FlavorValue = (typeof FLAVOR_OPTIONS)[number]['value'];
export type StoreTypeValue = (typeof STORE_TYPE_VALUES)[number];

export type ReportStockStatus = StoreStatus;
