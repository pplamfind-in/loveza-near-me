import { z } from 'zod';

export const forumCategories = ['พูดคุยทั่วไป', 'แนะนำร้าน', 'รีวิวสินค้า', 'ถามตอบ'] as const;
export const threadSchema = z.object({
  title: z.string().trim().min(3, 'หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร').max(150),
  body: z.string().trim().min(10, 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร').max(10000),
  category: z.enum(forumCategories),
});
export const commentSchema = z.string().trim().min(1, 'กรุณาเขียนความคิดเห็น').max(3000);
export const idSchema = z.uuid();
export type ForumActionState = { error?: string; success?: string };
export function pageNumber(value?: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 10000) : 1;
}
export function forumDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}
