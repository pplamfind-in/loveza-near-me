'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

import { createClient } from 'src/lib/supabase/server';

export async function voteForFlavor(pollId: string, formData: FormData) {
  if (!z.uuid().safeParse(pollId).success) redirect('/#flavor-polls');
  const href = paths.activity.details(pollId);
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
