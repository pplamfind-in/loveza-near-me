import { z } from 'zod';
import { notFound } from 'next/navigation';

import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';
import { ANNOUNCEMENT_BUCKET, announcementCalendarDate } from 'src/lib/announcements';

import { AnnouncementForm } from '../../announcement-form';

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireAdminClient();
  if (!user || !z.uuid().safeParse(id).success) notFound();

  const { data, error } = await supabase
    .from('system_announcements')
    .select('title, content_html, cover_path, publish_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('โหลดประกาศไม่สำเร็จ');
  if (!data) notFound();

  return (
    <AnnouncementForm
      id={id}
      values={{
        title: data.title,
        content: sanitizeFlavorPollDescription(data.content_html),
        publicationMode: data.publish_at
          ? Date.parse(data.publish_at) > new Date().getTime()
            ? 'scheduled'
            : 'immediate'
          : 'draft',
        publishDate: data.publish_at ? announcementCalendarDate(new Date(data.publish_at)) : '',
      }}
      coverUrl={
        data.cover_path
          ? supabase.storage.from(ANNOUNCEMENT_BUCKET).getPublicUrl(data.cover_path).data.publicUrl
          : undefined
      }
    />
  );
}
