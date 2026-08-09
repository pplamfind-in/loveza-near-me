// ----------------------------------------------------------------------

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type StoreStatus = 'available' | 'low_stock' | 'out_of_stock' | 'unknown';

export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
  available: 'มีสินค้า',
  low_stock: 'เหลือน้อย',
  out_of_stock: 'สินค้าหมด',
  unknown: 'ไม่แน่ใจ',
};

export type NearbyStore = {
  id: string;
  name: string;
  store_type?: string;
  store_type_logo_url?: string | null;
  reporter_display_name?: string | null;
  address: string | null;
  province: string;
  latitude: number;
  longitude: number;
  current_status: StoreStatus;
  estimated_quantity: number | null;
  last_reported_at: string | null;
  distance_km: number;
};

export type MapzaStore = Omit<NearbyStore, 'distance_km'> & {
  district: string | null;
  subdistrict: string | null;
};
