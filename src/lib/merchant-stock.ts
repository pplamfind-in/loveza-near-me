import type { NearbyStore } from 'src/types/store';

import { formatRelativeTimeTh } from 'src/utils/relative-time-th';

import { FLAVOR_OPTIONS } from 'src/types/report';

type StoreStock = Omit<NearbyStore, 'distance_km'>;

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function matchesMerchantStock(store: StoreStock, flavor: string, availableOnly: boolean) {
  if (!flavor && !availableOnly) return true;
  if (!store.stock_updated_by_merchant) return false;

  const entry = store.merchant_stock_by_flavor?.[flavor];
  if (flavor && !entry && !store.merchant_stock_flavors?.includes(flavor)) return false;

  const status = getStockStatus(store, flavor);
  return !availableOnly || status === 'available' || status === 'low_stock';
}

function merchantConfirmationTime(store: StoreStock, flavor: string) {
  if (!store.stock_updated_by_merchant) return null;

  const entry = store.merchant_stock_by_flavor?.[flavor];
  if (entry) return entry.updated_at;
  if (!flavor || store.merchant_stock_flavors?.includes(flavor)) return store.last_reported_at;
  return null;
}

export function getStockStatus(store: StoreStock, flavor: string) {
  return store.merchant_stock_by_flavor?.[flavor]?.status ?? store.current_status;
}

export function getStockQuantity(store: StoreStock, flavor: string) {
  return flavor ? store.merchant_stock_by_flavor?.[flavor]?.quantity ?? null : store.estimated_quantity;
}

export function newestMerchantStockFirst(a: StoreStock, b: StoreStock, flavor: string) {
  const timestampA = merchantConfirmationTime(a, flavor);
  const timestampB = merchantConfirmationTime(b, flavor);
  return (timestampB ? Date.parse(timestampB) : 0) - (timestampA ? Date.parse(timestampA) : 0);
}

export function merchantConfirmationLabel(store: StoreStock, flavor: string) {
  const timestamp = merchantConfirmationTime(store, flavor);
  if (!timestamp) return null;

  const age = Date.now() - Date.parse(timestamp);
  const warning = age >= STALE_AFTER_MS ? ' · ควรเช็กกับร้านก่อนเดินทาง' : '';
  const label = FLAVOR_OPTIONS.find(({ value }) => value === flavor)?.label;
  return ['ร้านยืนยัน', label, formatRelativeTimeTh(timestamp) || 'เมื่อสักครู่'].filter(Boolean).join(' ') + warning;
}
