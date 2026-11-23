import type { Metadata } from 'next';

import { z } from 'zod';
import { notFound } from 'next/navigation';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { getFlavorPollPublicationStatus } from 'src/lib/flavor-poll-schedule';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';

import { FlavorPollForm } from 'src/sections/admin/flavor-poll-form';

import { getFlavorPollCardProducts } from '../../card-products';

export const metadata: Metadata = { title: 'แก้ไขกิจกรรม | Loveza Admin' };

export default async function EditFlavorPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [poll, votes] = await Promise.all([
    supabase
      .from('flavor_polls')
      .select(
        'id, activity_type, title, slug, description_html, options, option_details, starts_at, ends_at, source_url, theme_color, theme_text_color, is_active, is_published'
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('flavor_poll_votes').select('poll_id').eq('poll_id', id).limit(1),
  ]);
  if (poll.error) throw new Error('โหลดกิจกรรมไม่สำเร็จ');
  if (!poll.data) notFound();

  const catalog =
    poll.data.activity_type === 'matching' ? await getFlavorPollCardProducts(supabase) : null;

  return (
    <FlavorPollForm
      poll={{
        ...poll.data,
        description_html: sanitizeFlavorPollDescription(poll.data.description_html),
        status: getFlavorPollPublicationStatus(poll.data),
      }}
      optionsLocked={Boolean(votes.error || votes.data?.length)}
      votesError={Boolean(votes.error)}
      cardProducts={catalog?.products}
      cardProductsError={catalog?.error}
    />
  );
}
