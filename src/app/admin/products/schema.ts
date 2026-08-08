import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(2, 'กรุณาระบุชื่อสินค้า').max(100),
  thai_name: z.string().trim().min(2, 'กรุณาระบุชื่อภาษาไทย').max(100),
  slug: z
    .string()
    .trim()
    .min(2, 'กรุณาระบุ slug')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง'),
  description: z.string().trim().max(300).nullable().optional(),
  image_url: z.union([z.literal(''), z.url('URL รูปภาพไม่ถูกต้อง')]).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'สีต้องอยู่ในรูปแบบ #RRGGBB'),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'สีต้องอยู่ในรูปแบบ #RRGGBB'),
  fruit: z.string().trim().min(1).max(12),
  meta: z.string().trim().min(1).max(120),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type ProductInput = z.infer<typeof productSchema>;
