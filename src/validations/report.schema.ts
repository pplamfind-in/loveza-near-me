import { z } from 'zod';

// ----------------------------------------------------------------------

export const STOCK_STATUS_OPTIONS = [
  { value: 'available', label: 'มีสินค้า' },
  { value: 'low_stock', label: 'เหลือน้อย' },
  { value: 'out_of_stock', label: 'สินค้าหมด' },
  { value: 'unknown', label: 'ไม่แน่ใจ' },
] as const;

export const FLAVOR_SUGGESTIONS = [
  'Original',
  'Thai Milk Tea',
  'Matcha',
  'Taro',
  'Chocolate',
  'Strawberry',
  'Coffee',
];

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const reportFormSchema = z.object({
  storeName: z.string().trim().min(2, 'กรุณากรอกชื่อร้านอย่างน้อย 2 ตัวอักษร').max(200),
  province: z.string().trim().min(1, 'กรุณาเลือกจังหวัด'),
  district: z.string().trim().max(120),
  subdistrict: z.string().trim().max(120),
  latitude: z
    .number({ error: 'กรุณาระบุพิกัดละติจูด' })
    .min(-90, 'พิกัดละติจูดไม่ถูกต้อง')
    .max(90, 'พิกัดละติจูดไม่ถูกต้อง'),
  longitude: z
    .number({ error: 'กรุณาระบุพิกัดลองจิจูด' })
    .min(-180, 'พิกัดลองจิจูดไม่ถูกต้อง')
    .max(180, 'พิกัดลองจิจูดไม่ถูกต้อง'),
  flavor: z.string().trim().max(120),
  stockStatus: z.enum(['available', 'low_stock', 'out_of_stock', 'unknown'], {
    error: 'กรุณาเลือกสถานะสินค้า',
  }),
  note: z.string().trim().max(500),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
