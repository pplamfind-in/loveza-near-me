import type { Metadata } from 'next';

import Image from 'next/image';
import { notFound } from 'next/navigation';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { createClient } from 'src/lib/supabase/server';
import { getForumImageUrl } from 'src/lib/supabase/forum-image';
import { getCommentPage } from 'src/lib/supabase/forum-comments';

import { ForumPostActions } from 'src/sections/forum/forum-forms';
import { ForumComments } from 'src/sections/forum/forum-comments';

import { idSchema, forumDate } from '../schema';

export const metadata: Metadata = { title: 'บทสนทนา | Loveza Hunt' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const db = await createClient();
  const [
    {
      data: { user },
    },
    { data: thread, error },
    initialComments,
  ] = await Promise.all([
    db.auth.getUser(),
    db
      .from('forum_threads')
      .select(
        'id,title,body,category,author_id,author_name,author_avatar_url,created_at,image_path'
      )
      .eq('id', id)
      .maybeSingle(),
    getCommentPage(id).catch(() => null),
  ]);
  if (error) return <Alert severity="error">โหลดกระทู้ไม่สำเร็จ กรุณาลองใหม่ภายหลัง</Alert>;
  if (!thread) notFound();
  return (
    <Stack spacing={3}>
      <Button href="/forum" sx={{ alignSelf: 'flex-start' }}>
        ← กลับหน้ากระทู้
      </Button>
      <Paper sx={{ p: { xs: 3, md: 4 }, border: '2px solid #351129', borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Chip label={thread.category} size="small" color="secondary" />
          {user?.id === thread.author_id && <ForumPostActions thread={thread} threadId={id} />}
        </Stack>
        <Typography component="h2" variant="h4" sx={{ my: 2, overflowWrap: 'anywhere' }}>
          {thread.title}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={thread.author_avatar_url ?? undefined}
            alt={thread.author_name}
            slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
            sx={{ width: 36, height: 36, bgcolor: '#FCE4F1', color: '#AD005E', fontSize: 15 }}
          >
            {thread.author_name.trim().slice(0, 1).toUpperCase()}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {thread.author_name} · {forumDate(thread.created_at)}
          </Typography>
        </Stack>
        {thread.image_path && (
          <Image
            src={getForumImageUrl(thread.image_path)!}
            alt={`รูปประกอบ ${thread.title}`}
            width={1200}
            height={800}
            unoptimized
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 640,
              objectFit: 'contain',
              borderRadius: 12,
              marginTop: 24,
            }}
          />
        )}
        <Typography sx={{ mt: 3, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {thread.body}
        </Typography>
      </Paper>
      <ForumComments threadId={id} userId={user?.id} initialPage={initialComments} />
    </Stack>
  );
}
