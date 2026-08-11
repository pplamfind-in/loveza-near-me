import { z } from 'zod';

export const adminLocationSchema = z.object({
  name: z.string().trim().min(2, 'กรุณาระบุชื่อสาขาอย่างน้อย 2 ตัวอักษร').max(120),
  address: z.string().trim().max(300, 'ที่อยู่ต้องไม่เกิน 300 ตัวอักษร'),
  province: z.string().trim().min(1, 'กรุณาระบุจังหวัด').max(100),
  district: z.string().trim().max(100),
  subdistrict: z.string().trim().max(100),
  latitude: z.number().finite('ละติจูดไม่ถูกต้อง').min(-90, 'ละติจูดต้องไม่ต่ำกว่า -90').max(90, 'ละติจูดต้องไม่เกิน 90'),
  longitude: z
    .number()
    .finite('ลองจิจูดไม่ถูกต้อง')
    .min(-180, 'ลองจิจูดต้องไม่ต่ำกว่า -180')
    .max(180, 'ลองจิจูดต้องไม่เกิน 180'),
  is_active: z.boolean(),
});

export type AdminLocationInput = z.infer<typeof adminLocationSchema>;
