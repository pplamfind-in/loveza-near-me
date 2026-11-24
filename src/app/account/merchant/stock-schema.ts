import { z } from 'zod';

import { FLAVOR_OPTIONS } from 'src/types/report';

export const merchantFlavorOptions = FLAVOR_OPTIONS.map(({ value }) => value).filter(
  (value) => value !== 'unknown'
);

export const merchantStockSchema = z.object({
  status: z.enum(['available', 'low_stock', 'out_of_stock', 'unknown'], {
    error: 'กรุณาเลือกสถานะสินค้า',
  }),
  flavor: z
    .enum(merchantFlavorOptions)
    .nullable()
    .refine((value) => value !== null, {
      message: 'กรุณาเลือกรสชาติ',
    }),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) <= 999999),
      'กรอกจำนวนเต็มตั้งแต่ 0 ถึง 999,999'
    ),
});

export type MerchantStock = z.infer<typeof merchantStockSchema>;
