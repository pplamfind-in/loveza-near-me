export const LANDING_BANNER_IMAGE_BUCKET = 'landing-banner-images';
export const MAX_LANDING_BANNER_IMAGE_SIZE = 10 * 1024 * 1024;
export const LANDING_BANNER_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${LANDING_BANNER_IMAGE_BUCKET}/`;

export function getLandingBannerImagePath(url: string | null | undefined) {
  if (!url) return null;

  try {
    const pathname = new URL(url).pathname;
    const markerIndex = pathname.indexOf(PUBLIC_PATH_MARKER);
    if (markerIndex === -1) return null;

    return decodeURIComponent(pathname.slice(markerIndex + PUBLIC_PATH_MARKER.length)) || null;
  } catch {
    return null;
  }
}
