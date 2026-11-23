'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

import { createClient } from 'src/lib/supabase/server';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

export async function voteForFlavor(pollId: string, slug: string | null, formData: FormData) {
  if (!z.uuid().safeParse(pollId).success) redirect('/#flavor-polls');
  const href = paths.activity.details(slug ?? pollId);
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(href)}`);

  const option = z.string().min(1).max(80).safeParse(formData.get('option'));
  if (!option.success) {
    redirect(`${href}?flavorVote=invalid`);
  }

  const { error } = await db.from('flavor_poll_votes').insert({
    poll_id: pollId,
    option_label: option.data,
  });
  if (error) {
    const status = error.code === '23505' ? 'duplicate' : 'error';
    redirect(`${href}?flavorVote=${status}`);
  }

  redirect(href);
}

export async function previewFlavorVote(pollId: string, slug: string | null, formData: FormData) {
  const { user } = await requireAdminClient();
  if (!user || !z.uuid().safeParse(pollId).success) redirect('/#flavor-polls');

  const href = `${paths.activity.details(slug ?? pollId)}?preview=1`;
  const option = z.string().min(1).max(80).safeParse(formData.get('option'));
  if (!option.success) redirect(href);

  // Keep the loading state visible long enough to inspect in the preview.
  await new Promise((resolve) => setTimeout(resolve, 550));
  redirect(`${href}&previewVote=${encodeURIComponent(option.data)}`);
}
