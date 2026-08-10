import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'กรุณาระบุชื่ออย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  email: z
    .string()
    .trim()
    .email('กรุณาระบุอีเมลให้ถูกต้อง')
    .max(254, 'อีเมลต้องไม่เกิน 254 ตัวอักษร'),
  subject: z
    .string()
    .trim()
    .min(2, 'กรุณาระบุหัวข้ออย่างน้อย 2 ตัวอักษร')
    .max(150, 'หัวข้อต้องไม่เกิน 150 ตัวอักษร'),
  message: z
    .string()
    .trim()
    .min(10, 'กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร')
    .max(5000, 'รายละเอียดต้องไม่เกิน 5,000 ตัวอักษร'),
  website: z.string().max(0).optional().default(''),
});

export type ContactMessageFormValues = z.input<typeof contactMessageSchema>;
export type ContactMessageInput = z.output<typeof contactMessageSchema>;
