export type StockStatus = 'available' | 'low_stock' | 'out_of_stock' | 'unknown';

export type Store = {
  id: string;
  name: string;
  address: string | null;
  province: string;
  district: string | null;
  subdistrict: string | null;
  latitude: number;
  longitude: number;
  current_status: StockStatus;
  last_reported_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreWithDistance = Store & {
  distanceKm: number | null;
};
