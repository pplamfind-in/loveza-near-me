export const STORE_TYPE_LOGO_BUCKET = 'store-type-logos';
export const MAX_STORE_TYPE_LOGO_SIZE = 2 * 1024 * 1024;
export const STORE_TYPE_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${STORE_TYPE_LOGO_BUCKET}/`;

export function getStoreTypeLogoPath(url: string | null | undefined) {
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
