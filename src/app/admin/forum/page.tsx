import type { Metadata } from 'next';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { forumDate, pageNumber, forumCategories } from 'src/app/forum/schema';

import { ForumCategoryFilter } from 'src/sections/admin/forum/category-filter';
import { ModerateButton, VisibilityButton } from 'src/sections/admin/forum/moderate-button';

export const metadata: Metadata = { title: 'จัดการกระทู้ | Loveza Admin' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const q = (params.q ?? '').trim().slice(0, 150);
  const category = forumCategories.find((value) => value === params.category) ?? '';
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;
  let query = supabase
    .from('forum_threads')
    .select('id,title,category,author_name,created_at,is_hidden,comments:forum_comments(count)', {
      count: 'exact',
    });
  if (q) query = query.ilike('title', `%${q.replace(/[\\%_]/g, '\\$&')}%`);
  if (category) query = query.eq('category', category);
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('id')
    .range((page - 1) * 20, page * 20 - 1);
  const href = (n: number) =>
    `/admin/forum?page=${n}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`;
  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">
          จัดการกระทู้
        </Typography>
        <Typography color="text.secondary">ตรวจสอบกระทู้ ความคิดเห็น และคำตอบของสมาชิก</Typography>
        <Stack
          component="form"
          action="/admin/forum"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
        >
          <TextField name="q" label="ค้นหาหัวข้อกระทู้" size="small" defaultValue={q} fullWidth />
          <ForumCategoryFilter key={category} category={category} categories={forumCategories} />
          <Button type="submit" variant="contained" sx={{ flexShrink: 0 }}>
            กรองรายการ
          </Button>
          {(q || category) && (
            <Button href="/admin/forum" color="inherit" sx={{ flexShrink: 0 }}>
              ล้างตัวกรอง
            </Button>
          )}
        </Stack>
        {!error && (
          <Typography variant="body2" color="text.secondary">
            {category || 'ทุกประเภท'} · พบ {count ?? 0} กระทู้
          </Typography>
        )}
        {error ? (
          <Alert severity="error">โหลดกระทู้ไม่สำเร็จ</Alert>
        ) : !data?.length ? (
          <Alert severity="info">ไม่พบกระทู้</Alert>
        ) : (
          data.map((thread) => (
            <Paper key={thread.id} variant="outlined" sx={{ p: 3 }}>
              <Stack direction="row" spacing={1}>
                <Chip label={thread.category} size="small" />
                <Chip
                  label={thread.is_hidden ? 'ซ่อนอยู่' : 'แสดงอยู่'}
                  color={thread.is_hidden ? 'warning' : 'success'}
                  size="small"
                />
              </Stack>
              <Typography variant="h6" sx={{ mt: 1, overflowWrap: 'anywhere' }}>
                {thread.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {thread.author_name} · {forumDate(thread.created_at)} ·{' '}
                {thread.comments?.[0]?.count ?? 0} ความคิดเห็น/คำตอบ
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button href={`/admin/forum/${thread.id}`} variant="outlined">
                  ตรวจดูกระทู้
                </Button>
                <VisibilityButton
                  id={thread.id}
                  threadId={thread.id}
                  kind="thread"
                  hidden={thread.is_hidden}
                />
                <ModerateButton id={thread.id} threadId={thread.id} kind="thread" />
              </Stack>
            </Paper>
          ))
        )}
        {(page > 1 || (count ?? 0) > 20) && (
          <Stack direction="row" justifyContent="center" spacing={2}>
            <Button href={href(page - 1)} disabled={page === 1}>
              ก่อนหน้า
            </Button>
            <Typography sx={{ alignSelf: 'center' }}>หน้า {page}</Typography>
            <Button href={href(page + 1)} disabled={page * 20 >= (count ?? 0)}>
              ถัดไป
            </Button>
          </Stack>
        )}
      </Stack>
    </DashboardContent>
  );
}
