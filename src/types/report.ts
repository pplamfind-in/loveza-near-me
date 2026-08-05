import type { StockStatus } from './store';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type Report = {
  id: string;
  store_id: string | null;
  store_name: string;
  address: string | null;
  province: string;
  district: string | null;
  subdistrict: string | null;
  latitude: number;
  longitude: number;
  flavor: string | null;
  stock_status: StockStatus;
  photo_url: string | null;
  note: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type NewReportInput = {
  store_name: string;
  province: string;
  district: string | null;
  subdistrict: string | null;
  latitude: number;
  longitude: number;
  flavor: string | null;
  stock_status: StockStatus;
  photo_url: string | null;
  note: string | null;
};
