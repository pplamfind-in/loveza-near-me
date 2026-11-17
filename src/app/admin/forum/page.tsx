import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { forumDate, pageNumber, forumCategories } from 'src/app/forum/schema';

import { ForumPagination } from 'src/sections/admin/forum/forum-pagination';
import { ForumCategoryFilter } from 'src/sections/admin/forum/category-filter';
import { ModerateButton, VisibilityButton } from 'src/sections/admin/forum/moderate-button';

export const metadata: Metadata = { title: 'จัดการกระทู้ | Loveza Admin' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const requestedSize = Number(params.pageSize);
  const pageSize = [10, 25, 50].includes(requestedSize) ? requestedSize : 10;
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
    .range((page - 1) * pageSize, page * pageSize - 1);
  const lastPage = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  if (!error && page > lastPage) {
    const queryParams = new URLSearchParams({
      page: String(lastPage),
      pageSize: String(pageSize),
      q,
      category,
    });
    redirect(`/admin/forum?${queryParams}`);
  }
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
          <input type="hidden" name="pageSize" value={pageSize} />
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
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
            <Table sx={{ minWidth: 1120 }} aria-label="รายการกระทู้">
              <TableHead>
                <TableRow>
                  <TableCell>หัวข้อกระทู้</TableCell>
                  <TableCell>ผู้เขียน</TableCell>
                  <TableCell>หมวดหมู่</TableCell>
                  <TableCell>วันที่สร้าง</TableCell>
                  <TableCell align="right">ความคิดเห็น</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell align="right">จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data ?? []).map((thread) => (
                  <TableRow key={thread.id} hover>
                    <TableCell sx={{ minWidth: 240, maxWidth: 360 }}>
                      <Typography
                        component="a"
                        href={`/admin/forum/${thread.id}`}
                        sx={{
                          fontWeight: 800,
                          color: 'text.primary',
                          textDecoration: 'none',
                          overflowWrap: 'anywhere',
                          '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                        }}
                      >
                        {thread.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{thread.author_name}</TableCell>
                    <TableCell>
                      <Chip label={thread.category} size="small" />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {forumDate(thread.created_at)}
                    </TableCell>
                    <TableCell align="right">{thread.comments?.[0]?.count ?? 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={thread.is_hidden ? 'ซ่อนอยู่' : 'แสดงอยู่'}
                        color={thread.is_hidden ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        <Button size="small" href={`/admin/forum/${thread.id}`} variant="outlined">
                          ตรวจดู
                        </Button>
                        <VisibilityButton
                          id={thread.id}
                          threadId={thread.id}
                          kind="thread"
                          hidden={thread.is_hidden}
                        />
                        <ModerateButton id={thread.id} threadId={thread.id} kind="thread" />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                      ไม่พบกระทู้
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ForumPagination page={page} count={count ?? 0} rowsPerPage={pageSize} />
          </TableContainer>
        )}
      </Stack>
    </DashboardContent>
  );
}
