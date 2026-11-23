'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { parseFlavorPollSourceUrl } from 'src/lib/flavor-poll-schedule';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';
import { FLAVOR_POLL_IMAGE_BUCKET, getFlavorPollOptionDetails } from 'src/lib/flavor-poll-options';

import { flavorPollSchema } from './schema';
import { getFlavorPollCardProducts } from './card-products';

const adminPath = '/admin/flavor-polls';
export async function saveFlavorPoll(id: string | null, values: unknown) {
  const { supabase, user } = await requireAdminClient();
  if (!user) redirect('/auth/login');

  const parsed = flavorPollSchema.safeParse(values);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? 'ข้อมูลกิจกรรมไม่ถูกต้อง';
  if (id !== null && !z.uuid().safeParse(id).success) return 'รหัสกิจกรรมไม่ถูกต้อง';

  if (id === null && parsed.data.publication === 'closed') return 'กรุณาสร้างกิจกรรมก่อนปิด';

  const {
    activityType,
    title,
    slug,
    descriptionHtml,
    publication,
    themeColor,
    themeTextColor,
    startsAt,
    endsAt,
    sourceUrl,
    options,
  } = parsed.data;
  const imageBase = supabase.storage
    .from(FLAVOR_POLL_IMAGE_BUCKET)
    .getPublicUrl('placeholder')
    .data.publicUrl.replace(/placeholder$/, '');
  const catalogImages = options
    .map(({ imageUrl }) => imageUrl)
    .filter(
      (url) =>
        url &&
        (!url.startsWith(imageBase) ||
          !/^[\da-f-]{36}\/[\da-f-]{36}\.webp$/i.test(url.slice(imageBase.length)))
    );
  if (catalogImages.length) {
    const [catalog, existing] = await Promise.all([
      getFlavorPollCardProducts(supabase),
      id
        ? supabase
            .from('flavor_polls')
            .select('activity_type, options, option_details')
            .eq('id', id)
            .maybeSingle()
        : null,
    ]);
    if ((id ? existing?.data?.activity_type : activityType) !== 'matching') {
      return 'เลือกรูปจากสินค้าได้เฉพาะเกมจับคู่';
    }
    const knownImages = new Set(catalog.products.map(({ imageUrl }) => imageUrl));
    for (const label of existing?.data?.options ?? []) {
      knownImages.add(getFlavorPollOptionDetails(existing?.data?.option_details, label).imageUrl);
    }
    if (catalogImages.some((url) => !knownImages.has(url))) {
      return 'รูปต้องมาจากสินค้าในแค็ตตาล็อกหรือการอัปโหลดในฟอร์ม';
    }
  }

  const start = publication === 'now' ? null : startsAt;
  const activityDescription = sanitizeFlavorPollDescription(descriptionHtml);
  if (activityDescription.length > 20000) return 'รายละเอียดกิจกรรมยาวเกินกำหนด';
  const row = {
    title,
    slug: slug || null,
    description_html: activityDescription,
    is_published: publication !== 'draft',
    theme_color: themeColor || null,
    theme_text_color: themeTextColor || null,
    options: options.map(({ label }) => label),
    option_details: Object.fromEntries(
      options.map(({ label, description, imageUrl }) => [label, { description, imageUrl }])
    ),
    starts_at: start,
    ends_at: endsAt,
    source_url: parseFlavorPollSourceUrl(sourceUrl),
  };
  const query =
    id === null
      ? supabase.from('flavor_polls').insert({ ...row, activity_type: activityType })
      : supabase
          .from('flavor_polls')
          .update({
            ...row,
            ...(publication !== 'draft' && { is_active: publication !== 'closed' }),
          })
          .eq('id', id);
  const { error } = await query.select('id').single();
  if (error?.code === '23505') return 'Slug นี้ถูกใช้งานแล้ว';
  if (error?.code === '23514')
    return 'กิจกรรมมีผลโหวตแล้ว กรุณาโหลดหน้าใหม่เพื่อแก้รายละเอียดโดยคงตัวเลือกเดิม';
  if (error) return 'บันทึกกิจกรรมไม่สำเร็จ';
  if (publication === 'closed') redirect(`${adminPath}?status=closed`);
  return redirect(
    `${adminPath}?status=${publication === 'draft' ? 'draft-saved' : id === null ? (start ? 'scheduled' : 'created') : 'updated'}`
  );
}

export async function setFlavorPollActive(id: string, isActive: boolean) {
  const { supabase, user } = await requireAdminClient();
  if (!user) redirect('/auth/login');

  if (!z.uuid().safeParse(id).success || typeof isActive !== 'boolean') {
    redirect(`${adminPath}?status=invalid`);
  }

  const { error } = await supabase
    .from('flavor_polls')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id')
    .single();
  redirect(`${adminPath}?status=${error ? 'error' : 'updated'}`);
}

export async function deleteFlavorPoll(id: string, formData: FormData) {
  const { supabase, user } = await requireAdminClient();
  if (!user) redirect('/auth/login');

  if (!z.uuid().safeParse(id).success || formData.get('confirmDelete') !== 'on') {
    redirect(`${adminPath}?status=confirm-delete`);
  }

  const { error } = await supabase.from('flavor_polls').delete().eq('id', id).select('id').single();
  redirect(`${adminPath}?status=${error ? 'error' : 'deleted'}`);
}
