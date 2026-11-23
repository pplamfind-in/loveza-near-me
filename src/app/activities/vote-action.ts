'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

import { createClient } from 'src/lib/supabase/server';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getGuestVoterId, GUEST_VOTER_COOKIE } from 'src/lib/flavor-poll-guest';

export async function voteForFlavor(pollId: string, slug: string | null, formData: FormData) {
  if (!z.uuid().safeParse(pollId).success) redirect('/#flavor-polls');
  const href = paths.activity.details(slug ?? pollId);
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  const option = z.string().min(1).max(80).safeParse(formData.get('option'));
  if (!option.success) {
    redirect(`${href}?flavorVote=invalid`);
  }

  const guestId = await getGuestVoterId();

  if (user && guestId) {
    const guestVote = await db
      .rpc('get_guest_flavor_vote', { target_poll_id: pollId, browser_id: guestId })
      .maybeSingle();
    if (guestVote.error) redirect(`${href}?flavorVote=error`);
    if (guestVote.data) redirect(href);
  }

  const browserId = guestId ?? randomUUID();
  if (!user && !guestId) {
    (await cookies()).set(GUEST_VOTER_COOKIE, browserId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/activities',
    });
  }

  const { error } = user
    ? await db.from('flavor_poll_votes').insert({
        poll_id: pollId,
        option_label: option.data,
      })
    : await db.rpc('cast_guest_flavor_vote', {
        target_poll_id: pollId,
        browser_id: browserId,
        choice: option.data,
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
