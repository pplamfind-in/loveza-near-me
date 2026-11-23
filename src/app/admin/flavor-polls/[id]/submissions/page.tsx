import { z } from 'zod';
import { notFound, redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { ACTIVITY_PHOTO_BUCKET } from 'src/lib/activity-photo';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { formatBangkokPollDate } from 'src/lib/flavor-poll-schedule';

const pageSize = 24;

export default async function ActivitySubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ id }, { page }, { supabase, user }] = await Promise.all([
    params,
    searchParams,
    requireAdminClient(),
  ]);
  if (!user) redirect('/auth/login');
  if (!z.uuid().safeParse(id).success) notFound();

  const parsedPage = z.coerce.number().int().min(1).max(100_000).safeParse(page);
  const currentPage = parsedPage.success ? parsedPage.data : 1;
  const offset = (currentPage - 1) * pageSize;
  const [activity, submissions] = await Promise.all([
    supabase
      .from('flavor_polls')
      .select('title')
      .eq('id', id)
      .eq('activity_type', 'photo')
      .maybeSingle(),
    supabase
      .from('activity_photo_submissions')
      .select('id, image_path, created_at', { count: 'exact' })
      .eq('activity_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1),
  ]);
  if (activity.error) throw new Error('โหลดกิจกรรมไม่สำเร็จ');
  if (!activity.data) notFound();

  const rows = submissions.data ?? [];
  const signed = rows.length
    ? await supabase.storage.from(ACTIVITY_PHOTO_BUCKET).createSignedUrls(
        rows.map((row) => row.image_path),
        3600
      )
    : null;
  const urls = new Map(signed?.data?.map((item) => [item.path, item.signedUrl]));
  const href = `/admin/flavor-polls/${id}/submissions/`;

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={2.5}>
        <Button href="/admin/flavor-polls/" color="inherit" sx={{ alignSelf: 'flex-start' }}>
          กลับไปหน้ากิจกรรม
        </Button>
        <Box>
          <Typography component="h1" variant="h4">
            ภาพที่ส่งเข้าร่วมกิจกรรม
          </Typography>
          <Typography color="text.secondary">{activity.data.title}</Typography>
        </Box>
        {submissions.error || signed?.error ? (
          <Alert severity="error">โหลดภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
        ) : null}
        {!submissions.error && (
          <Typography variant="body2">ทั้งหมด {submissions.count ?? 0} ภาพ</Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {rows.map((row) => {
            const url = urls.get(row.image_path);
            return (
              <Stack
                key={row.id}
                spacing={1}
                sx={{ minWidth: 0, p: 1.25, borderRadius: 2, bgcolor: 'background.paper' }}
              >
                {url ? (
                  <Box component="a" href={url} target="_blank" rel="noopener noreferrer">
                    <Box
                      component="img"
                      src={url}
                      loading="lazy"
                      alt="ภาพที่ส่งเข้าร่วมกิจกรรม"
                      sx={{
                        display: 'block',
                        width: 1,
                        aspectRatio: 1,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                ) : (
                  <Typography>เปิดภาพไม่ได้</Typography>
                )}
                <Typography variant="caption">
                  {formatBangkokPollDate(row.created_at)} น.
                </Typography>
              </Stack>
            );
          })}
        </Box>
        <Stack direction="row" justifyContent="space-between">
          {currentPage > 1 && <Button href={`${href}?page=${currentPage - 1}`}>หน้าก่อน</Button>}
          {(submissions.count ?? 0) > offset + pageSize && (
            <Button href={`${href}?page=${currentPage + 1}`} sx={{ ml: 'auto' }}>
              หน้าถัดไป
            </Button>
          )}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
