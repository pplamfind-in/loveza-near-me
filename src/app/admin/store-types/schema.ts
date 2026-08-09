import { z } from 'zod';

export const storeTypeMasterSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'กรุณาระบุ code')
    .max(50)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'code ใช้เฉพาะ a-z, 0-9 และขีดล่าง'),
  name: z.string().trim().min(2, 'กรุณาระบุชื่อประเภทร้าน').max(100),
  logo_url: z.union([z.literal(''), z.url('URL Logo ไม่ถูกต้อง')]).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type StoreTypeMasterInput = z.infer<typeof storeTypeMasterSchema>;
