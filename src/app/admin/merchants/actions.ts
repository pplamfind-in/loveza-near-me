'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

const assignmentSchema = z
  .object({
    merchantId: z.uuid(),
    storeId: z.union([z.literal(''), z.uuid()]),
    storeType: z
      .string()
      .max(80)
      .regex(/^[a-z0-9_]*$/),
    access: z.enum(['grant', 'revoke']),
  })
  .refine(({ storeId, storeType }) => Boolean(storeId) !== Boolean(storeType));

export async function setMerchantBranches(formData: FormData) {
  const { supabase, user } = await requireAdminClient();
  if (!user) redirect('/auth/login');

  const result = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) redirect('/admin/merchants?status=invalid');

  const { merchantId, storeId, storeType, access } = result.data;
  const { data, error } = await supabase.rpc('set_merchant_branches', {
    target_merchant_id: merchantId,
    target_store_id: storeId || null,
    target_store_type: storeType || null,
    allow_access: access === 'grant',
  });

  if (error) redirect('/admin/merchants?status=error');
  revalidatePath('/admin/merchants');
  revalidatePath('/account/merchant');
  redirect(`/admin/merchants?status=${access}&count=${Number(data) || 0}`);
}
