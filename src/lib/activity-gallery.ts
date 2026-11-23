export const galleryPageSize = 12;

export type GalleryPhoto = {
  id: string;
  src: string;
  name: string;
  avatar: string | null;
  likeCount: number;
};

type GalleryRow = {
  photo_id: string;
  like_count: number | string;
  author_name: string | null;
  author_avatar_url: string | null;
};

export function galleryPhotoPage(rows: GalleryRow[]) {
  return {
    hasMore: rows.length > galleryPageSize,
    photos: rows.slice(0, galleryPageSize).map(
      (row): GalleryPhoto => ({
        id: row.photo_id,
        likeCount: Number(row.like_count ?? 0),
        src: `/api/activities/gallery/${row.photo_id}/`,
        name: row.author_name || 'ผู้ร่วมกิจกรรม',
        avatar: row.author_avatar_url,
      })
    ),
  };
}
