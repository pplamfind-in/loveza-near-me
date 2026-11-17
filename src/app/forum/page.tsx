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

import { forumDate, pageNumber, forumCategories } from './schema';

export const metadata: Metadata = createSeoMetadata({
  title: 'กระทู้สนทนา | Loveza Hunt',
  description: 'พูดคุย แนะนำร้าน และรีวิว Loveza กับชุมชนสายซ่า',
  path: '/forum/',
});

const categoryIcons = [
  'ri:chat-3-line',
  'ri:store-2-line',
  'ri:star-smile-line',
  'ri:question-answer-line',
];
const forumHref = (page: number, category?: string) =>
  `/forum?${new URLSearchParams({ page: String(page), ...(category ? { category } : {}) })}`;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const category = forumCategories.find((value) => value === params.category);
  const db = await createClient();
  let query = db
    .from('forum_threads')
    .select(
      'id,title,body,category,author_name,author_avatar_url,created_at,image_path,comments:forum_comments(count)',
      { count: 'exact' }
    );
  if (category) query = query.eq('category', category);
  const [
    {
      data: { user },
    },
    { data: threads, error, count },
  ] = await Promise.all([
    db.auth.getUser(),
    query
      .order('created_at', { ascending: false })
      .order('id')
      .range((page - 1) * 20, page * 20 - 1),
  ]);
  return (
    <Stack spacing={2.5}>
      <Stack
        component="nav"
        aria-label="หมวดหมู่กระทู้"
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <Button
          href="/forum"
          aria-current={!category ? 'page' : undefined}
          startIcon={<Iconify icon="ri:apps-2-line" width={17} />}
          sx={{
            minHeight: 40,
            px: 2,
            bgcolor: !category ? 'primary.main' : 'background.paper',
            color: !category ? 'common.white' : 'text.secondary',
            '&:hover': { bgcolor: !category ? 'primary.dark' : 'primary.lighter' },
          }}
        >
          ทั้งหมด
        </Button>
        {forumCategories.map((item, index) => (
          <Button
            key={item}
            href={forumHref(1, item)}
            aria-current={category === item ? 'page' : undefined}
            startIcon={<Iconify icon={categoryIcons[index]} width={17} />}
            sx={{
              minHeight: 40,
              px: 2,
              bgcolor: category === item ? 'primary.main' : 'background.paper',
              color: category === item ? 'common.white' : 'text.secondary',
              '&:hover': { bgcolor: category === item ? 'primary.dark' : 'primary.lighter' },
            }}
          >
            {item}
          </Button>
        ))}
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography component="h2" sx={{ fontSize: 23, fontWeight: 800 }}>
            {category ?? 'บทสนทนาล่าสุด'}{' '}
            <Box
              component="span"
              sx={{ ml: 0.75, fontSize: 13, fontWeight: 500, color: 'text.secondary' }}
            >
              {error ? '' : `${count ?? 0} กระทู้`}
            </Box>
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
            เลือกเรื่องที่สนใจ แล้วมาร่วมวงคุยกัน
          </Typography>
        </Box>
        {user ? (
          <CreateThreadButton />
        ) : (
          <Button
            variant="contained"
            href="/auth/login?next=/forum"
            startIcon={<Iconify icon="ri:add-line" />}
            sx={{ flexShrink: 0, minHeight: 44 }}
          >
            เข้าสู่ระบบเพื่อตั้งกระทู้
          </Button>
        )}
      </Stack>
      {error ? (
        <Alert severity="error">โหลดกระทู้ไม่สำเร็จ กรุณาลองใหม่ภายหลัง</Alert>
      ) : !threads?.length ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: '5px solid var(--palette-background-paper)',
            borderRadius: '18px',
          }}
        >
          <Iconify icon="ri:chat-smile-3-line" width={40} sx={{ color: 'primary.main', mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700 }}>
            {page === 1
              ? category
                ? 'ยังไม่มีบทสนทนาในหมวดนี้'
                : 'มาเริ่มบทสนทนาแรกกัน!'
              : 'ไม่มีกระทู้ในหน้านี้'}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary' }}>
            ชวนเพื่อนคุยเรื่อง Loveza หรือแชร์การค้นพบของคุณ
          </Typography>
          {page > 1 ? (
            <Button href={forumHref(1, category)} sx={{ mt: 2 }}>
              กลับหน้าแรกของหมวด
            </Button>
          ) : null}
        </Paper>
      ) : (
        threads.map((thread) => (
          <Paper
            key={thread.id}
            component="article"
            elevation={0}
            sx={{
              overflow: 'hidden',
              border: '5px solid var(--palette-background-paper)',
              borderRadius: '18px',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 0 var(--palette-grey-200)',
            }}
          >
            <ButtonBase
              href={`/forum/${thread.id}`}
              sx={{
                width: 1,
                display: 'flex',
                alignItems: 'stretch',
                textAlign: 'left',
                p: { xs: 2, sm: 2.5 },
                gap: { xs: 1.5, sm: 3 },
                '&:hover': { bgcolor: 'background.default' },
                '&.Mui-focusVisible': {
                  outline: '3px solid var(--palette-primary-main)',
                  outlineOffset: -3,
                },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Chip
                  label={thread.category}
                  size="small"
                  sx={{
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: 'primary.lighter',
                    color: 'primary.dark',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Typography
                  component="h3"
                  sx={{
                    mt: 1.25,
                    fontSize: { xs: 18, sm: 21 },
                    fontWeight: 800,
                    lineHeight: 1.5,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {thread.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.75,
                    color: 'text.secondary',
                    fontSize: 13,
                    lineHeight: 1.8,
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
                  useFlexGap
                  flexWrap="wrap"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ mt: 2 }}
                >
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ minWidth: 0, maxWidth: '100%' }}
                  >
                    <Avatar
                      src={thread.author_avatar_url ?? undefined}
                      alt=""
                      slotProps={{ img: { loading: 'lazy', referrerPolicy: 'no-referrer' } }}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: 11,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                      }}
                    >
                      {thread.author_name.trim().slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Typography noWrap sx={{ fontSize: 11, fontWeight: 700 }}>
                      {thread.author_name}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {forumDate(thread.created_at)}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ color: 'primary.main' }}
                  >
                    <Iconify icon="ri:chat-3-line" width={15} />
                    <Typography sx={{ fontSize: 11 }}>
                      {thread.comments?.[0]?.count ?? 0} ความคิดเห็น
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              {thread.image_path ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 80, sm: 170 },
                    height: { xs: 100, sm: 150 },
                    flexShrink: 0,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    alignSelf: 'center',
                  }}
                >
                  <Image
                    src={getForumImageUrl(thread.image_path)!}
                    alt={`รูปประกอบ ${thread.title}`}
                    fill
                    unoptimized
                    sizes="170px"
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'grid' },
                    alignSelf: 'center',
                    placeItems: 'center',
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: '12px',
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <Iconify icon="ri:arrow-right-line" width={20} />
                </Box>
              )}
            </ButtonBase>
          </Paper>
        ))
      )}
      {(page > 1 || (count ?? 0) > 20) && (
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
          <Button
            href={forumHref(page - 1, category)}
            disabled={page === 1}
            startIcon={<Iconify icon="ri:arrow-left-s-line" width={18} />}
          >
            ก่อนหน้า
          </Button>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>หน้า {page}</Typography>
          <Button
            href={forumHref(page + 1, category)}
            disabled={!!error || page * 20 >= (count ?? 0)}
            endIcon={<Iconify icon="ri:arrow-right-s-line" width={18} />}
          >
            ถัดไป
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
