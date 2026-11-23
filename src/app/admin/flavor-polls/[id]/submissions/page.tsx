import { z } from 'zod';
import Form from 'next/form';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { ACTIVITY_PHOTO_BUCKET } from 'src/lib/activity-photo';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { formatBangkokPollDate } from 'src/lib/flavor-poll-schedule';

import { Iconify } from 'src/components/iconify';

import { PhotoPreview } from './photo-preview';
import { setActivityPhotoHidden } from '../../actions';

const pageSize = 24;
type PhotoRow = {
  id: string;
  image_path: string;
  created_at: string | null;
  is_hidden: boolean;
  author_name: string;
  like_count: number | string;
};
const exampleAuthors = ['พลอย', 'ต้น', 'เมย์', 'กัน', 'ฟ้า', 'นัท'];
const exampleLikes = [18, 7, 0, 12, 23, 4];
const exampleImages = [
  '/assets/loveza/nearby-explorer-v1.webp',
  '/assets/loveza/loveza-hero-v2.png',
  '/assets/illustrations/p-sung-potion-soda.webp',
  '/assets/illustrations/p-soda-girl.webp',
  '/assets/loveza/loveza-yogurt.webp',
  '/assets/loveza/loveza-lemon.webp',
];

export default async function ActivitySubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    visibility?: string;
    preview?: string;
    hidden?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const [{ id }, { page, visibility, preview, hidden, q, sort: sortParam }, { supabase, user }] =
    await Promise.all([params, searchParams, requireAdminClient()]);
  if (!user) redirect('/auth/login');
  if (!z.uuid().safeParse(id).success) notFound();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const showExamples = isDevelopment && preview === '1';
  const hiddenExamples = new Set(
    (typeof hidden === 'string' ? hidden : '2').split(',').filter((value) => /^[1-6]$/.test(value))
  );

  const parsedPage = z.coerce.number().int().min(1).max(100_000).safeParse(page);
  const currentPage = parsedPage.success ? parsedPage.data : 1;
  const offset = (currentPage - 1) * pageSize;
  const authorQuery = (typeof q === 'string' ? q : '').trim().slice(0, 100);
  const sort = sortParam === 'oldest' || sortParam === 'likes' ? sortParam : 'newest';
  const ascending = sort === 'oldest';
  const href = `/admin/flavor-polls/${id}/submissions/`;
  const filters = new URLSearchParams({ sort });
  if (authorQuery) filters.set('q', authorQuery);
  if (showExamples) {
    filters.set('preview', '1');
    filters.set('hidden', Array.from(hiddenExamples).join(','));
  }

  const query = showExamples
    ? null
    : supabase.rpc(
        'list_admin_activity_photos',
        { target_activity_id: id, author_query: authorQuery },
        { count: 'exact' }
      );
  if (sort === 'likes') query?.order('like_count', { ascending: false });
  const [activity, submissions] = await Promise.all([
    supabase
      .from('flavor_polls')
      .select('title')
      .eq('id', id)
      .eq('activity_type', 'photo')
      .maybeSingle(),
    query
      ?.order('created_at', { ascending })
      .order('id', { ascending })
      .range(offset, offset + pageSize - 1),
  ]);
  if (activity.error) throw new Error('โหลดกิจกรรมไม่สำเร็จ');
  if (!activity.data) notFound();

  const examples = showExamples
    ? exampleImages
        .map(
          (imagePath, index): PhotoRow => ({
            id: String(index + 1),
            image_path: imagePath,
            created_at: null,
            is_hidden: hiddenExamples.has(String(index + 1)),
            author_name: exampleAuthors[index],
            like_count: exampleLikes[index],
          })
        )
        .filter(({ author_name: author }) =>
          author.toLowerCase().includes(authorQuery.toLowerCase())
        )
        .sort((first, second) => {
          const byDate = ascending
            ? Number(first.id) - Number(second.id)
            : Number(second.id) - Number(first.id);
          return sort === 'likes'
            ? Number(second.like_count) - Number(first.like_count) || byDate
            : byDate;
        })
    : [];
  const rows = showExamples ? examples : ((submissions?.data ?? []) as PhotoRow[]);
  const signed =
    !showExamples && rows.length
      ? await supabase.storage.from(ACTIVITY_PHOTO_BUCKET).createSignedUrls(
          rows.map((row) => row.image_path),
          3600
        )
      : null;
  const urls = new Map(signed?.data?.map((item) => [item.path, item.signedUrl]));
  const pageHref = (pageNumber: number) => {
    const queryParams = new URLSearchParams(filters);
    queryParams.set('page', String(pageNumber));
    return `${href}?${queryParams}`;
  };

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
        {isDevelopment && (
          <Button
            href={showExamples ? href : `${href}?preview=1`}
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          >
            {showExamples ? 'กลับไปดูรูปที่ส่งจริง' : 'ดูตัวอย่างการจัดการรูป'}
          </Button>
        )}

        <Form action={href} key={filters.toString()}>
          {showExamples && (
            <>
              <input type="hidden" name="preview" value="1" />
              <input type="hidden" name="hidden" value={filters.get('hidden') ?? ''} />
            </>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
            <TextField
              type="search"
              name="q"
              label="ชื่อผู้ส่ง"
              defaultValue={authorQuery}
              size="small"
              slotProps={{ htmlInput: { maxLength: 100 } }}
              sx={{ width: { xs: 1, sm: 240 } }}
            />
            <TextField
              select
              name="sort"
              label="เรียงตาม"
              defaultValue={sort}
              size="small"
              sx={{ minWidth: 150, '& .MuiSelect-select': { typography: 'body2' } }}
            >
              <MenuItem value="newest" sx={{ typography: 'body2' }}>
                ภาพล่าสุด
              </MenuItem>
              <MenuItem value="oldest" sx={{ typography: 'body2' }}>
                ภาพแรกสุด
              </MenuItem>
              <MenuItem value="likes" sx={{ typography: 'body2' }}>
                หัวใจมากสุด
              </MenuItem>
            </TextField>
            <Button type="submit" variant="contained" startIcon={<Iconify icon="ri:search-line" />}>
              ค้นหา
            </Button>
            {authorQuery && (
              <Button
                href={`${href}?${new URLSearchParams(Array.from(filters).filter(([key]) => key !== 'q'))}`}
              >
                ล้างการค้นหา
              </Button>
            )}
          </Stack>
        </Form>
     
        {!submissions?.error && rows.length === 0 && authorQuery && (
          <Typography>ไม่พบภาพจากชื่อผู้ส่งที่ค้นหา</Typography>
        )}
        {!submissions?.error && (
          <Typography variant="body2">ทั้งหมด {submissions?.count ?? rows.length} ภาพ</Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
              lg: 'repeat(6, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {rows.map((row) => {
            const url = showExamples ? row.image_path : urls.get(row.image_path);
            const { author_name: author, like_count: likeCount } = row;
            const nextHidden = Array.from(hiddenExamples).filter(
              (exampleId) => exampleId !== row.id
            );
            if (!row.is_hidden) nextHidden.push(row.id);
            return (
              <Stack
                key={row.id}
                spacing={1}
                useFlexGap
                sx={{
                  position: 'relative',
                  minWidth: 0,
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  key={String(row.is_hidden)}
                  component="details"
                  sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                >
                  <Box
                    component="summary"
                    aria-label={author ? `จัดการภาพของ ${author}` : 'จัดการภาพ'}
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 36,
                      height: 36,
                      listStyle: 'none',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: 2 },
                      '&::-webkit-details-marker': { display: 'none' },
                    }}
                  >
                    <Iconify icon="ri:more-2-fill" width={20} />
                  </Box>
                  <Box
                    component="form"
                    action={
                      showExamples
                        ? href
                        : setActivityPhotoHidden.bind(
                            null,
                            id,
                            row.id,
                            !row.is_hidden,
                            currentPage,
                            authorQuery,
                            sort
                          )
                    }
                    sx={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      width: 'max-content',
                      p: 0.5,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      boxShadow: 6,
                    }}
                  >
                    {showExamples && (
                      <>
                        <input type="hidden" name="preview" value="1" />
                        <input type="hidden" name="hidden" value={nextHidden.join(',')} />
                        <input type="hidden" name="q" value={authorQuery} />
                        <input type="hidden" name="sort" value={sort} />
                      </>
                    )}
                    <Button
                      type="submit"
                      color={row.is_hidden ? 'primary' : 'warning'}
                      size="small"
                      startIcon={
                        <Iconify icon={row.is_hidden ? 'ri:eye-line' : 'ri:eye-off-line'} />
                      }
                    >
                      {row.is_hidden ? 'ยกเลิกการซ่อน' : 'ซ่อนจากแกลเลอรี'}
                    </Button>
                  </Box>
                </Box>
                {url ? (
                  <PhotoPreview src={url} author={author} />
                ) : (
                  <Typography>เปิดภาพไม่ได้</Typography>
                )}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                    {author ?? '—'}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Image
                      src="/assets/loveza/loveza-heart.webp"
                      alt="หัวใจ"
                      width={20}
                      height={18}
                      unoptimized
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {likeCount == null ? '—' : Number(likeCount).toLocaleString('th-TH')}
                    </Typography>
                  </Stack>
                </Stack>
                {row.created_at && (
                  <Typography variant="caption">
                    {formatBangkokPollDate(row.created_at)} น.
                  </Typography>
                )}
                {row.is_hidden && (
                  <Typography variant="caption" color="warning.main">
                    ซ่อนจากแกลเลอรีแล้ว
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Box>
        <Stack direction="row" justifyContent="space-between">
          {!showExamples && currentPage > 1 && (
            <Button href={pageHref(currentPage - 1)}>หน้าก่อน</Button>
          )}
          {(submissions?.count ?? rows.length) > offset + pageSize && (
            <Button href={pageHref(currentPage + 1)} sx={{ ml: 'auto' }}>
              หน้าถัดไป
            </Button>
          )}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
