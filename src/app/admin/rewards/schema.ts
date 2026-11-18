import { z } from 'zod';

export const rewardSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(2)
      .max(70)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'รหัสใช้ตัวอักษร a-z ตัวเลข และขีดกลาง'),
    name: z.string().trim().min(2, 'กรุณาระบุชื่อรางวัล').max(70),
    character: z.string().regex(/^p-[a-z0-9-]+\.webp$/, 'กรุณาเลือกรูปตัวละคร'),
    metric: z
      .string()
      .min(2, 'กรุณาเลือกเงื่อนไข')
      .max(60)
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
    target: z
      .number()
      .int('กรุณาระบุจำนวนเต็ม')
      .min(1, 'เป้าหมายต้องอย่างน้อย 1')
      .max(9999, 'เป้าหมายต้องไม่เกิน 9,999'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'สีต้องเป็นรหัส HEX'),
    sort_order: z
      .number()
      .int('กรุณาระบุจำนวนเต็ม')
      .min(0, 'ลำดับต้องไม่ติดลบ')
      .max(9999, 'ลำดับต้องไม่เกิน 9,999'),
    is_active: z.boolean(),
    required_product_id: z.string().uuid().nullable(),
    starts_at: z
      .string()
      .datetime({ offset: true, message: 'กรุณาเลือกวันและเวลาให้ถูกต้อง' })
      .nullable(),
    ends_at: z
      .string()
      .datetime({ offset: true, message: 'กรุณาเลือกวันและเวลาให้ถูกต้อง' })
      .nullable(),
  })
  .refine(
    (value) =>
      (!value.starts_at && !value.ends_at) ||
      (Boolean(value.starts_at && value.ends_at) &&
        Date.parse(value.ends_at!) > Date.parse(value.starts_at!)),
    { message: 'ระบุวันเริ่มและสิ้นสุด โดยวันสิ้นสุดต้องอยู่หลังวันเริ่ม', path: ['ends_at'] }
  );

export type RewardInput = z.infer<typeof rewardSchema>;
