import { z } from 'zod';

import { ANNOUNCEMENT_COVER_LIMIT, ANNOUNCEMENT_COVER_TYPES } from 'src/lib/announcements';

export const publicationModes = ['immediate', 'scheduled', 'draft'] as const;

export function hasAnnouncementContent(html: string) {
  return Boolean(html.replace(/<[^>]*>|&nbsp;|&#160;/gi, '').trim()) || /<img\b/i.test(html);
}

export const announcementSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'กรุณากรอกหัวข้อประกาศ')
      .max(160, 'หัวข้อต้องไม่เกิน 160 ตัวอักษร'),
    content: z.string().max(100000, 'รายละเอียดประกาศยาวเกินไป'),
    publicationMode: z.enum(publicationModes),
    publishDate: z.string(),
    cover: z
      .file()
      .max(ANNOUNCEMENT_COVER_LIMIT, 'รูปภาพต้องไม่เกิน 5 MB')
      .mime(ANNOUNCEMENT_COVER_TYPES, 'รองรับไฟล์ JPG, PNG และ WebP')
      .nullish(),
    removeCover: z.boolean(),
  })
  .refine(
    ({ publicationMode, content }) =>
      publicationMode === 'draft' || hasAnnouncementContent(content),
    { path: ['content'], message: 'กรุณากรอกรายละเอียดประกาศ' }
  )
  .refine(
    ({ publicationMode, publishDate }) =>
      publicationMode !== 'scheduled' || z.iso.date().safeParse(publishDate).success,
    { path: ['publishDate'], message: 'กรุณาเลือกวันที่เผยแพร่' }
  );

export type AnnouncementValues = z.infer<typeof announcementSchema>;
