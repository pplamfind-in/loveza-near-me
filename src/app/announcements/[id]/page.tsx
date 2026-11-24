import { z } from 'zod';
import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createClient } from 'src/lib/supabase/server';
import { sanitizeFlavorPollDescription } from 'src/lib/flavor-poll-description';
import { ANNOUNCEMENT_BUCKET, formatAnnouncementDate } from 'src/lib/announcements';

export const dynamic = 'force-dynamic';

export default async function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_announcements')
    .select('title, content_html, cover_path, publish_at')
    .eq('id', id)
    .lte('publish_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error('โหลดประกาศไม่สำเร็จ');
  if (!data) notFound();

  return (
    <Container component="main" maxWidth="md" sx={{ pt: 14, pb: 8 }}>
      <Button href="/announcements" sx={{ mb: 2 }}>
        กลับไปหน้าประกาศ
      </Button>
      <Box component="article">
        <Typography
          variant="body2"
          color="text.secondary"
          component="time"
          dateTime={data.publish_at}
        >
          {formatAnnouncementDate(data.publish_at)}
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 1, mb: 3, overflowWrap: 'anywhere' }}>
          {data.title}
        </Typography>
        {data.cover_path && (
          <Box
            component="img"
            src={
              supabase.storage.from(ANNOUNCEMENT_BUCKET).getPublicUrl(data.cover_path).data
                .publicUrl
            }
            alt=""
            sx={{ maxWidth: '100%', maxHeight: 480, borderRadius: 2, mb: 3, display: 'block' }}
          />
        )}
        <Box
          sx={{
            overflowWrap: 'anywhere',
            lineHeight: 1.8,
            '& img': { maxWidth: '100%', height: 'auto' },
            '& pre': { overflowX: 'auto' },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeFlavorPollDescription(data.content_html) }}
        />
      </Box>
    </Container>
  );
}
