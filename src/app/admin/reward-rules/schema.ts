import { z } from 'zod';

export const rewardRuleSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'ใช้ตัวอักษร ตัวเลข ขีดกลางหรือขีดล่าง'),
    name: z.string().trim().min(2, 'ระบุชื่อเงื่อนไข').max(80),
    source: z.enum(['uniqueStores', 'provinces', 'approvedReports', 'explorationDays']),
    unit: z.string().trim().min(1, 'ระบุหน่วย').max(20),
    description: z.string().trim().max(300),
    max_target: z.number().int().min(1).max(9999),
    sort_order: z.number().int().min(0).max(9999),
    is_active: z.boolean(),
  })
  .refine((v) => v.source !== 'provinces' || v.max_target <= 77, {
    message: 'จำนวนจังหวัดสูงสุด 77',
    path: ['max_target'],
  });
export type RewardRuleInput = z.infer<typeof rewardRuleSchema>;
