import type { MetadataRoute } from 'next';

import { absoluteUrl, OG_IMAGE_URL, PUBLIC_SEO_ROUTES } from 'src/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_SEO_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    images: [OG_IMAGE_URL],
  }));
}
