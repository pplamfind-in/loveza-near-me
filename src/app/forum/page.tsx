import type { Metadata } from 'next';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { getForumImageUrl } from 'src/lib/supabase/forum-image';

import { Iconify } from 'src/components/iconify';

import { CreateThreadButton } from 'src/sections/forum/forum-forms';

import { forumDate, pageNumber } from './schema';

export const metadata: Metadata = createSeoMetadata({
  title: 'กระทู้สนทนา | Loveza Hunt',
  description: 'พูดคุย แนะนำร้าน และรีวิว Loveza กับชุมชนสายซ่า',
  path: '/forum/',
});

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page);
  const db = await createClient();
  const [
    {
      data: { user },
    },
    { data: threads, error, count },
  ] = await Promise.all([
    db.auth.getUser(),
    db
      .from('forum_threads')
      .select(
        'id,title,body,category,author_name,author_avatar_url,created_at,image_path,comments:forum_comments(count)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .order('id')
      .range((page - 1) * 20, page * 20 - 1),
  ]);
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography component="h2" variant="h5">
            กระทู้ล่าสุด
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            เลือกกระทู้เพื่ออ่านและร่วมพูดคุย
          </Typography>
        </Box>
        {user ? (
          <CreateThreadButton />
        ) : (
          <Button variant="contained" href="/auth/login?next=/forum" sx={{ flexShrink: 0 }}>
            เข้าสู่ระบบเพื่อตั้งกระทู้
          </Button>
        )}
      </Stack>
      {error ? (
        <Alert severity="error">โหลดกระทู้ไม่สำเร็จ กรุณาลองใหม่ภายหลัง</Alert>
      ) : !threads?.length ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>
            {page === 1 ? 'ยังไม่มีกระทู้ มาเริ่มบทสนทนาแรกกัน!' : 'ไม่มีกระทู้ในหน้านี้'}
          </Typography>
        </Paper>
      ) : (
        threads.map((thread) => (
          <Paper
            key={thread.id}
            component="article"
            elevation={0}
            sx={{
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2.5,
            }}
          >
            <ButtonBase
              href={`/forum/${thread.id}`}
              sx={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                p: { xs: 2.5, sm: 3 },
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: '#FFF8FC' },
                '&.Mui-focusVisible': { outline: '3px solid #E5007E', outlineOffset: -3 },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Chip label={thread.category} size="small" color="secondary" />
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ color: 'text.secondary' }}
                >
                  <Iconify icon="ri:chat-3-line" width={17} />
                  <Typography variant="caption">
                    {thread.comments?.[0]?.count ?? 0} ความคิดเห็น
                  </Typography>
                </Stack>
              </Stack>
              {thread.image_path && (
                <Image
                  src={getForumImageUrl(thread.image_path)!}
                  alt={`รูปประกอบ ${thread.title}`}
                  width={800}
                  height={400}
                  unoptimized
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginTop: 16,
                  }}
                />
              )}
              <Typography
                component="h3"
                variant="h6"
                sx={{ mt: 1.5, color: 'text.primary', overflowWrap: 'anywhere' }}
              >
                {thread.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflowWrap: 'anywhere',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {thread.body.slice(0, 200)}
              </Typography>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ mt: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Avatar
                    src={thread.author_avatar_url ?? undefined}
                    alt={thread.author_name}
                    slotProps={{ img: { loading: 'lazy', referrerPolicy: 'no-referrer' } }}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 12,
                      bgcolor: '#FCE4F1',
                      color: '#AD005E',
                    }}
                  >
                    {thread.author_name.trim().slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" component="p" noWrap sx={{ fontWeight: 700 }}>
                      {thread.author_name}
                    </Typography>
                    <Typography variant="caption" component="p" color="text.secondary">
                      {forumDate(thread.created_at)}
                    </Typography>
                  </Box>
                </Stack>
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ color: 'primary.main', flexShrink: 0 }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    อ่านกระทู้
                  </Typography>
                  <Iconify icon="ri:arrow-right-s-line" width={18} />
                </Stack>
              </Stack>
            </ButtonBase>
          </Paper>
        ))
      )}
      {(page > 1 || (count ?? 0) > 20) && (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button href={`/forum?page=${page - 1}`} disabled={page === 1}>
            ก่อนหน้า
          </Button>
          <Typography sx={{ alignSelf: 'center' }}>หน้า {page}</Typography>
          <Button href={`/forum?page=${page + 1}`} disabled={!!error || page * 20 >= (count ?? 0)}>
            ถัดไป
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
