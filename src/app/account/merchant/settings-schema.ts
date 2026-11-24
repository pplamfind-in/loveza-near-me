import { z } from 'zod';

import { STORE_LOGO_MAX_BYTES, STORE_LOGO_MIME_TYPES } from 'src/lib/supabase/store-logo';

export const merchantSettingsSchema = z
  .object({
    logo: z
      .file()
      .min(1, 'กรุณาเลือกไฟล์รูป')
      .max(STORE_LOGO_MAX_BYTES, 'โลโก้ต้องไม่เกิน 2 MB')
      .mime([...STORE_LOGO_MIME_TYPES], 'รองรับ JPG, PNG หรือ WebP')
      .nullable(),
    removeLogo: z.boolean(),
    name: z.string().trim().max(120, 'ชื่อร้านต้องไม่เกิน 120 ตัวอักษร'),
    branch_name: z.string().trim().max(120, 'ชื่อสาขาต้องไม่เกิน 120 ตัวอักษร'),
    store_type_code: z
      .string()
      .max(80)
      .regex(/^[a-z0-9_]*$/, 'กรุณาเลือกร้านจากข้อมูล Master'),
  })
  .refine(({ name, store_type_code }) => Boolean(name || store_type_code), {
    message: 'กรุณากรอกชื่อร้าน',
    path: ['name'],
  });

export type MerchantSettings = z.infer<typeof merchantSettingsSchema>;
