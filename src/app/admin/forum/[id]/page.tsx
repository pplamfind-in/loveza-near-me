import type { Metadata } from 'next';

import Image from 'next/image';
import { notFound } from 'next/navigation';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { getForumImageUrl } from 'src/lib/supabase/forum-image';
import { requireAdminClient } from 'src/lib/supabase/require-admin';
import { idSchema, forumDate, pageNumber } from 'src/app/forum/schema';

import { ModerateButton, VisibilityButton } from 'src/sections/admin/forum/moderate-button';

export const metadata: Metadata = { title: 'ตรวจสอบกระทู้ | Loveza Admin' };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const page = pageNumber((await searchParams).page);
  const { supabase, user } = await requireAdminClient();
  if (!user) return null;
  const [{ data: thread, error }, { data: comments, count, error: commentError }] =
    await Promise.all([
      supabase
        .from('forum_threads')
        .select('id,title,body,category,author_name,image_path,created_at,is_hidden')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('forum_comments')
        .select('id,body,parent_id,author_name,created_at,is_hidden', { count: 'exact' })
        .eq('thread_id', id)
        .order('created_at')
        .order('id')
        .range((page - 1) * 30, page * 30 - 1),
    ]);
  if (!error && !thread) notFound();
  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Button href="/admin/forum" sx={{ alignSelf: 'flex-start' }}>
          ← กลับหน้าจัดการกระทู้
        </Button>
        {error || !thread ? (
          <Alert severity="error">โหลดกระทู้ไม่สำเร็จ</Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={1}>
              <Chip label={thread.category} size="small" />
              <Chip
                label={thread.is_hidden ? 'ซ่อนอยู่' : 'แสดงอยู่'}
                color={thread.is_hidden ? 'warning' : 'success'}
                size="small"
              />
            </Stack>
            <Typography component="h1" variant="h4" sx={{ my: 2, overflowWrap: 'anywhere' }}>
              {thread.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {thread.author_name} · {forumDate(thread.created_at)}
            </Typography>
            {thread.image_path && (
              <Image
                src={getForumImageUrl(thread.image_path)!}
                alt="รูปประกอบกระทู้"
                width={1200}
                height={800}
                unoptimized
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 500,
                  objectFit: 'contain',
                  marginTop: 16,
                }}
              />
            )}
            <Typography sx={{ my: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {thread.body}
            </Typography>
            <Stack direction="row" spacing={1}>
              <VisibilityButton id={id} threadId={id} kind="thread" hidden={thread.is_hidden} />
              <ModerateButton id={id} threadId={id} kind="thread" />
            </Stack>
          </Paper>
        )}
        <Typography component="h2" variant="h5">
          ความคิดเห็นและคำตอบ ({count ?? 0})
        </Typography>
        {commentError ? (
          <Alert severity="error">โหลดความคิดเห็นไม่สำเร็จ</Alert>
        ) : !comments?.length ? (
          <Typography color="text.secondary">ไม่มีความคิดเห็นในหน้านี้</Typography>
        ) : (
          comments.map((comment) => (
            <Paper key={comment.id} id={`comment-${comment.id}`} variant="outlined" sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
              >
                <Stack spacing={0.5}>
                  <Typography fontWeight={700}>{comment.author_name}</Typography>
                  <Chip
                    label={comment.is_hidden ? 'ซ่อนอยู่' : 'แสดงอยู่'}
                    color={comment.is_hidden ? 'warning' : 'success'}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {forumDate(comment.created_at)}
                  </Typography>
                  {comment.parent_id && (
                    <Chip
                      label="คำตอบใต้ความคิดเห็น"
                      size="small"
                      sx={{ alignSelf: 'flex-start' }}
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <VisibilityButton
                    id={comment.id}
                    threadId={id}
                    kind="comment"
                    hidden={comment.is_hidden}
                  />
                  <ModerateButton id={comment.id} threadId={id} kind="comment" />
                </Stack>
              </Stack>
              <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {comment.body}
              </Typography>
            </Paper>
          ))
        )}
        {(page > 1 || (count ?? 0) > 30) && (
          <Stack direction="row" justifyContent="center" spacing={2}>
            <Button href={`/admin/forum/${id}?page=${page - 1}`} disabled={page === 1}>
              ก่อนหน้า
            </Button>
            <Typography sx={{ alignSelf: 'center' }}>หน้า {page}</Typography>
            <Button
              href={`/admin/forum/${id}?page=${page + 1}`}
              disabled={page * 30 >= (count ?? 0)}
            >
              ถัดไป
            </Button>
          </Stack>
        )}
      </Stack>
    </DashboardContent>
  );
}
