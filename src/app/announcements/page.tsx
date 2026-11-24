import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createClient } from 'src/lib/supabase/server';
import { ANNOUNCEMENT_BUCKET, formatAnnouncementDate } from 'src/lib/announcements';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ประกาศจากระบบ | Loveza Hunt' };

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_announcements')
    .select('id, title, cover_path, publish_at')
    .lte('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: false })
    .order('id');

  if (error) throw new Error('โหลดประกาศไม่สำเร็จ');

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 14, pb: 8 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 3 }}>
        ประกาศจากระบบ
      </Typography>
      {!data.length && <Typography color="text.secondary">ยังไม่มีประกาศ</Typography>}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {data.map((item) => (
          <Card key={item.id} variant="outlined">
            {item.cover_path && (
              <Box
                component="img"
                src={
                  supabase.storage.from(ANNOUNCEMENT_BUCKET).getPublicUrl(item.cover_path).data
                    .publicUrl
                }
                alt=""
                loading="lazy"
                sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
              />
            )}
            <Stack spacing={1} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {formatAnnouncementDate(item.publish_at)}
              </Typography>
              <Typography variant="h6" component="h2" sx={{ overflowWrap: 'anywhere' }}>
                {item.title}
              </Typography>
              <Button
                href={`/announcements/${item.id}`}
                aria-label={`อ่านประกาศ ${item.title}`}
                sx={{ alignSelf: 'flex-start' }}
              >
                อ่านประกาศ
              </Button>
            </Stack>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
