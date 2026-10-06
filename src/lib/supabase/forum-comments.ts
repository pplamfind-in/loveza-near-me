import type { CommentPage } from 'src/sections/forum/comment-types';

import { z } from 'zod';

import { createClient } from './server';

export const commentCursorSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});

export async function getCommentPage(
  threadId: string,
  cursor?: CommentPage['nextCursor'],
  parentId?: string
): Promise<CommentPage> {
  const db = await createClient();
  let query = db
    .from('forum_comments')
    .select('id,body,author_id,author_name,author_avatar_url,created_at,parent_id', {
      count: 'exact',
    })
    .eq('thread_id', threadId);
  query = parentId ? query.eq('parent_id', z.uuid().parse(parentId)) : query.is('parent_id', null);
  if (cursor) {
    const value = commentCursorSchema.parse(cursor);
    query = query.or(
      `created_at.gt.${value.createdAt},and(created_at.eq.${value.createdAt},id.gt.${value.id})`
    );
  }
  const { data, error, count } = await query.order('created_at').order('id').limit(31);
  if (error) throw new Error('โหลดความคิดเห็นไม่สำเร็จ');
  const rows = (data ?? []).slice(0, 30);
  const counts = new Map<string, number>();
  if (!parentId && rows.length) {
    const result = await db.rpc('forum_reply_counts', { comment_ids: rows.map((row) => row.id) });
    if (result.error) throw new Error('โหลดจำนวนคำตอบไม่สำเร็จ');
    for (const row of result.data ?? []) counts.set(row.parent_id, Number(row.reply_count));
  }
  const comments = rows.map((comment) => ({
    ...comment,
    reply_count: counts.get(comment.id) ?? 0,
  }));
  const last = comments.at(-1);
  return {
    comments,
    total: count ?? 0,
    nextCursor:
      (data?.length ?? 0) > 30 && last ? { createdAt: last.created_at, id: last.id } : null,
  };
}
