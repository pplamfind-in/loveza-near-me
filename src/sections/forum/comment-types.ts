export type ForumComment = {
  id: string;
  body: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  created_at: string;
  parent_id: string | null;
  reply_count: number;
};
export type CommentPage = {
  comments: ForumComment[];
  total: number;
  nextCursor: { createdAt: string; id: string } | null;
};
