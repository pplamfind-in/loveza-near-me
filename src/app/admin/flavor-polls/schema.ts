import { z } from 'zod';

import { isActivitySlug } from 'src/lib/activity-slug';
import { activityColorPattern } from 'src/lib/activity-theme';
import { parseFlavorPollSourceUrl } from 'src/lib/flavor-poll-schedule';

const dateTimeSchema = z.iso.datetime('กรุณาระบุวันและเวลาให้ถูกต้อง').nullable();

export const flavorPollSchema = z
  .object({
    activityType: z.enum(['poll', 'matching', 'photo'], { error: 'กรุณาเลือกประเภทกิจกรรม' }),
    title: z.string().trim().min(1, 'กรุณากรอกหัวข้อ').max(140, 'หัวข้อต้องไม่เกิน 140 ตัวอักษร'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (value) => !value || isActivitySlug(value),
        'Slug ใช้ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลางได้ไม่เกิน 80 ตัวอักษร'
      ),
    descriptionHtml: z.string().max(20000, 'รายละเอียดกิจกรรมยาวเกินกำหนด'),
    publication: z.enum(['now', 'scheduled', 'draft', 'closed']),
    themeColor: z
      .string()
      .refine((color) => !color || activityColorPattern.test(color), 'กรุณาเลือกสีที่ถูกต้อง'),
    backgroundImageUrl: z.string().max(500),
    themeTextColor: z
      .string()
      .refine(
        (color) => !color || activityColorPattern.test(color),
        'กรุณาเลือกสีข้อความที่ถูกต้อง'
      ),
    startsAt: z.string().nullable(),
    endsAt: dateTimeSchema,
    sourceUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) => !value || Boolean(parseFlavorPollSourceUrl(value)),
        'กรุณาใส่ URL ต้นทางที่ขึ้นต้นด้วย https://'
      ),
    options: z
      .array(
        z.object({
          label: z.string().trim().max(80, 'ชื่อตัวเลือกต้องไม่เกิน 80 ตัวอักษร'),
          description: z.string().trim().max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร'),
          imageUrl: z.string().max(500),
        })
      )
      .max(12, 'เพิ่มได้ไม่เกิน 12 ตัวเลือก'),
  })
  .superRefine(({ activityType, publication, startsAt, endsAt, options }, ctx) => {
    if (publication === 'scheduled' && !startsAt) {
      ctx.addIssue({ code: 'custom', path: ['startsAt'], message: 'กรุณาเลือกวันเริ่มกิจกรรม' });
    }
    if (publication !== 'now' && startsAt && !dateTimeSchema.safeParse(startsAt).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['startsAt'],
        message: 'กรุณาระบุวันและเวลาให้ถูกต้อง',
      });
    }
    if (publication !== 'now' && startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'วันสิ้นสุดต้องอยู่หลังวันเริ่ม' });
    }
    if (activityType === 'photo') return;

    if (options.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'กรุณาระบุอย่างน้อย 2 ตัวเลือก' });
    }
    const labels = new Set<string>();
    options.forEach(({ label }, index) => {
      if (!label || labels.has(label)) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', index, 'label'],
          message: label ? 'ชื่อตัวเลือกนี้ซ้ำกัน' : 'กรุณากรอกชื่อตัวเลือก',
        });
      }
      labels.add(label);
    });
  });

export type FlavorPollFormValues = z.infer<typeof flavorPollSchema>;
