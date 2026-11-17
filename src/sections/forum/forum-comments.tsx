'use client';

import type { CommentPage, ForumComment } from './comment-types';

import useSWRInfinite from 'swr/infinite';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { forumDate } from 'src/app/forum/schema';

import { CommentForm, ForumPostActions } from './forum-forms';

async function fetchComments(url: string): Promise<CommentPage> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('โหลดความคิดเห็นไม่สำเร็จ');
  return response.json();
}

export function ForumComments({
  threadId,
  userId,
  initialPage = null,
  parentId,
  onChanged,
}: {
  threadId: string;
  userId?: string;
  initialPage?: CommentPage | null;
  parentId?: string;
  onChanged?: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const fetching = useRef(false);
  const { data, error, size, setSize, mutate, isValidating } = useSWRInfinite<CommentPage>(
    (index, previous: CommentPage | null) => {
      if (index > 0 && !previous?.nextCursor) return null;
      const search = new URLSearchParams();
      if (index > 0) search.set('cursor', JSON.stringify(previous?.nextCursor));
      if (parentId) search.set('parentId', parentId);
      return `/api/forum/${threadId}/comments?${search.toString()}`;
    },
    fetchComments,
    {
      fallbackData: initialPage ? [initialPage] : undefined,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  const pages = data ?? [];
  const comments = [
    ...new Map(
      pages.flatMap((page) => page.comments).map((comment) => [comment.id, comment])
    ).values(),
  ];
  const hasMore = Boolean(pages.at(-1)?.nextCursor);
  const loading =
    isValidating || (!error && (pages.length === 0 || (hasMore && size > pages.length)));
  const loadMore = useCallback(async () => {
    if (fetching.current || loading || error || !hasMore) return;
    fetching.current = true;
    try {
      await setSize((value) => value + 1);
    } catch {
      // SWR exposes the request error through the retry UI below.
    } finally {
      fetching.current = false;
    }
  }, [loading, error, hasMore, setSize]);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || error || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: '0px 0px 160px 0px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, error, loadMore]);
  const refresh = () => {
    void mutate().catch(() => undefined);
    onChanged?.();
  };
  const composer = userId && (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {parentId ? 'ตอบกลับความคิดเห็น' : 'ร่วมพูดคุย'}
      </Typography>
      <CommentForm threadId={threadId} parentId={parentId} onSaved={refresh} />
    </Paper>
  ) 
  
  return (
    <Stack spacing={2}>
      {!parentId && (
        <Typography component="h3" variant="h5">
          ความคิดเห็น ({pages[0]?.total ?? initialPage?.total ?? 0})
        </Typography>
      )}
      {parentId && composer}
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          threadId={threadId}
          userId={userId}
          onChanged={refresh}
        />
      ))}
      {!comments.length && !loading && !error && (
        <Typography color="text.secondary">
          {parentId ? 'ยังไม่มีคำตอบ มาเริ่มตอบกัน!' : 'ยังไม่มีความคิดเห็น มาเริ่มพูดคุยกัน!'}
        </Typography>
      )}
      <Box
        ref={sentinel}
        sx={{ minHeight: hasMore || loading || error ? 48 : 0, textAlign: 'center' }}
        aria-live="polite"
        aria-busy={loading}
      >
        {loading ? (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{ py: 1 }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              กำลังโหลดความคิดเห็น…
            </Typography>
          </Stack>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={refresh}>
                ลองอีกครั้ง
              </Button>
            }
          >
            โหลดความคิดเห็นไม่สำเร็จ
          </Alert>
        ) : hasMore ? (
          <Button onClick={() => void loadMore()}>โหลดความคิดเห็นเพิ่มเติม</Button>
        ) : comments.length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            แสดงความคิดเห็นครบแล้ว
          </Typography>
        ) : null}
      </Box>
      {!parentId && composer}
    </Stack>
  );
}

function CommentCard({
  comment,
  threadId,
  userId,
  onChanged,
}: {
  comment: ForumComment;
  threadId: string;
  userId?: string;
  onChanged: () => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  return (
    <Paper
      component="article"
      elevation={0}
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          src={comment.author_avatar_url ?? undefined}
          alt={comment.author_name}
          slotProps={{ img: { loading: 'lazy', referrerPolicy: 'no-referrer' } }}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'var(--palette-primary-lighter)',
            color: 'var(--palette-primary-main)',
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {comment.author_name.trim().slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="subtitle2">{comment.author_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {forumDate(comment.created_at)}
              </Typography>
            </Box>
            {userId === comment.author_id && (
              <ForumPostActions comment={comment} threadId={threadId} onChanged={onChanged} />
            )}
          </Stack>
          <Typography
            sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.8 }}
          >
            {comment.body}
          </Typography>
          {!comment.parent_id && (
            <Button
              size="small"
              aria-expanded={showReplies}
              onClick={() => setShowReplies((value) => !value)}
              sx={{ mt: 1, px: 0.5 }}
            >
              {showReplies
                ? 'ซ่อนคำตอบ'
                : comment.reply_count > 0
                  ? `ตอบกลับ · ${comment.reply_count} คำตอบ`
                  : 'ตอบกลับ'}
            </Button>
          )}
        </Box>
      </Stack>
      {showReplies && !comment.parent_id && (
        <Box
          sx={{
            mt: 2,
            ml: { xs: 1, sm: 3 },
            pl: { xs: 1, sm: 2 },
            borderLeft: '2px solid',
            borderColor: 'divider',
          }}
        >
          <ForumComments
            threadId={threadId}
            parentId={comment.id}
            userId={userId}
            onChanged={onChanged}
          />
        </Box>
      )}
    </Paper>
  );
}
