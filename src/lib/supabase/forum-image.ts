export const FORUM_IMAGE_BUCKET = 'forum-images';
export const MAX_STORED_FORUM_IMAGE_SIZE = 2 * 1024 * 1024;
export const MAX_FORUM_IMAGE_SIZE = 5 * 1024 * 1024;
export const FORUM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function getForumImageUrl(path?: string | null) {
  if (!path) return undefined;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${FORUM_IMAGE_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
