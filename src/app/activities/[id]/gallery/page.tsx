import { z } from 'zod';
import Form from 'next/form';
import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';

import { paths } from 'src/routes/paths';

import { isActivitySlug } from 'src/lib/activity-slug';
import { createClient } from 'src/lib/supabase/server';
import { galleryPageSize, galleryPhotoPage } from 'src/lib/activity-gallery';
import {
  activityTheme,
  activityColorPattern,
  activityViewportStyles,
} from 'src/lib/activity-theme';

import { Iconify } from 'src/components/iconify';

import { ActivityGalleryGrid } from 'src/sections/home/activity-gallery-grid';

const exampleImages = [
  '/assets/loveza/nearby-explorer-v1.webp',
  '/assets/loveza/loveza-hero-v2.png',
  '/assets/illustrations/p-sung-potion-soda.webp',
  '/assets/illustrations/p-soda-girl.webp',
  '/assets/loveza/loveza-yogurt.webp',
  '/assets/loveza/loveza-lemon.webp',
  '/assets/loveza/loveza-lychee.webp',
  '/assets/loveza/loveza-grape.webp',
];

export default async function ActivityGallery({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; preview?: string; q?: string }>;
}) {
  const [{ id }, { page, preview, q }] = await Promise.all([params, searchParams]);
  const key = z.uuid().safeParse(id).success ? 'id' : 'slug';
  if (key === 'slug' && !isActivitySlug(id)) notFound();
  const currentPage = z.coerce.number().int().min(1).max(100000).catch(1).parse(page);
  const authorQuery = (typeof q === 'string' ? q : '').trim().slice(0, 100);
  const db = await createClient();
  const { data: activity, error } = await db
    .from('flavor_polls')
    .select('id, slug, title, theme_color, theme_text_color')
    .eq(key, id)
    .eq('activity_type', 'photo')
    .eq('is_published', true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .maybeSingle();
  if (error) throw new Error('โหลดกิจกรรมไม่สำเร็จ');
  if (!activity) notFound();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const showExamples = isDevelopment && preview === '1';
  const [
    gallery,
    {
      data: { user },
    },
  ] = await Promise.all([
    showExamples
      ? null
      : db
          .rpc('list_activity_gallery', {
            target_activity_id: activity.id,
            ...(authorQuery ? { author_query: authorQuery } : {}),
            page_offset: (currentPage - 1) * galleryPageSize,
          })
          .limit(galleryPageSize + 1),
    db.auth.getUser(),
  ]);
  const exampleAuthors = ['พลอย', 'ต้น', 'เมย์', 'กัน', 'ฟ้า', 'นัท', 'บีม', 'พิม'];
  const exampleAvatars = [
    'cheerful',
    'explorer',
    'gardener',
    'gamer',
    'nurse',
    'runner',
    'campfire',
    'laptop',
  ];
  const galleryPage = galleryPhotoPage(gallery?.data ?? []);
  const examples = showExamples
    ? Array.from({ length: 32 }, (_, index) => {
        const imageIndex = index % exampleImages.length;
        return {
          id: `example-${index}`,
          src: exampleImages[imageIndex],
          likeCount: 0,
          name: exampleAuthors[imageIndex],
          avatar: `/assets/avatar/avatar-${exampleAvatars[imageIndex]}.webp`,
        };
      }).filter(({ name }) => name.toLowerCase().includes(authorQuery.toLowerCase()))
    : [];
  const imageCards = showExamples ? examples.slice(0, galleryPageSize) : galleryPage.photos;
  const href = paths.activity.details(activity.slug ?? activity.id);

  return (
    <Box
      component="main"
      data-activity-screen
      sx={{
        ...activityTheme(activity.theme_color),
        minHeight: '100dvh',
        flexGrow: 1,
        bgcolor: 'var(--activity-primary)',
        color:
          activity.theme_text_color && activityColorPattern.test(activity.theme_text_color)
            ? activity.theme_text_color
            : 'var(--activity-contrast)',
        px: { xs: 2, sm: 4 },
        pt: { xs: 'calc(env(safe-area-inset-top, 0px) + 8px)', md: 4 },
        pb: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', md: 4 },
      }}
    >
      <GlobalStyles styles={activityViewportStyles(activity.theme_color)} />
      <Stack spacing={2.5} sx={{ width: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Button
            href={href}
            color="inherit"
            startIcon={<Iconify icon="ri:arrow-left-line" />}
            sx={{ alignSelf: 'flex-start', minHeight: 44 }}
          >
            กลับไปหน้ากิจกรรม
          </Button>
          <Box key={authorQuery} component="details" sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              component="summary"
              aria-label="ค้นหาตามชื่อผู้ส่ง"
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 44,
                height: 44,
                borderRadius: 1,
                cursor: 'pointer',
                listStyle: 'none',
                '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: 2 },
                '&::-webkit-details-marker': { display: 'none' },
              }}
            >
              <Iconify icon="ri:search-line" width={24} />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: 'min(320px, calc(100vw - 32px))',
                p: 1.5,
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderRadius: 2,
                boxShadow: 6,
              }}
            >
              <Form action={`${href}gallery/`}>
                {showExamples && <input type="hidden" name="preview" value="1" />}
                <Stack spacing={1}>
                  <TextField
                    name="q"
                    type="search"
                    size="small"
                    label="ชื่อผู้ส่ง"
                    defaultValue={authorQuery}
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                  <Stack direction="row" justifyContent="flex-end">
                    <Button type="submit" variant="contained">
                      ค้นหา
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            </Box>
          </Box>
        </Stack>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            component="span"
            variant="subtitle2"
            sx={{
              display: 'inline-block',
              px: 2,
              py: 0.5,
              borderRadius: '999px',
              border: '1px solid var(--activity-primary)',
              bgcolor: 'common.white',
              color: 'var(--activity-primary)',
            }}
          >
            ภาพจากกิจกรรม
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 0.75,
              fontSize: { xs: 'clamp(28px, 7vw, 36px)', sm: 44 },
              fontWeight: 900,
              lineHeight: 1.25,
              textWrap: 'balance',
            }}
          >
            {activity.title}
          </Typography>
        </Box>
        {showExamples && (
          <Typography align="center" variant="body2">
            ภาพตัวอย่างสำหรับตรวจการจัดวาง
          </Typography>
        )}
        {authorQuery && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            flexWrap="wrap"
          >
            <Typography>ค้นหาชื่อผู้ส่ง «{authorQuery}»</Typography>
            <Button color="inherit" href={`${href}gallery/${showExamples ? '?preview=1' : ''}`}>
              ล้างการค้นหา
            </Button>
          </Stack>
        )}
        {gallery?.error ? (
          <Alert severity="error">โหลดภาพกิจกรรมไม่สำเร็จ</Alert>
        ) : imageCards.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
            <Typography>
              {authorQuery ? 'ไม่พบภาพจากชื่อผู้ส่งที่ค้นหา' : 'ยังไม่มีภาพที่เปิดให้ชม'}
            </Typography>
            {isDevelopment && !authorQuery && (
              <Button color="inherit" href={`${href}gallery/?preview=1`}>
                ดูภาพตัวอย่าง
              </Button>
            )}
          </Stack>
        ) : (
          <ActivityGalleryGrid
            key={`${activity.id}:${showExamples}:${currentPage}:${authorQuery}`}
            authorQuery={authorQuery}
            initialPhotos={imageCards}
            initialHasMore={showExamples ? examples.length > galleryPageSize : galleryPage.hasMore}
            initialOffset={showExamples ? 0 : (currentPage - 1) * galleryPageSize}
            activityId={activity.id}
            examples={examples}
            showExamples={showExamples}
            signedIn={Boolean(user)}
            googleClientId={user ? '' : (process.env.GOOGLE_CLIENT_ID ?? '')}
          />
        )}
      </Stack>
    </Box>
  );
}
