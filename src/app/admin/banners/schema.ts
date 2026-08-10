import { z } from 'zod';

const imageLocation = z.string().trim().refine(
  (value) => value.startsWith('/') || z.url().safeParse(value).success,
  'URL รูปภาพไม่ถูกต้อง'
);

export const landingBannerSchema = z.object({
  title: z.string().trim().min(2, 'กรุณาระบุชื่อ Banner').max(100),
  image_url: imageLocation,
  mobile_image_url: z.union([z.literal(''), imageLocation]).nullable().optional(),
  alt_text: z.string().trim().max(180, 'คำอธิบายรูปต้องไม่เกิน 180 ตัวอักษร'),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type LandingBannerInput = z.infer<typeof landingBannerSchema>;
