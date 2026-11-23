import { z } from 'zod';

import { createClient } from 'src/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  if (!z.uuid().safeParse(photoId).success) return new Response(null, { status: 404 });

  const db = await createClient();
  const { data, error } = await db.rpc('get_activity_gallery_image', { target_photo_id: photoId });
  if (error) return new Response(null, { status: 500 });
  if (typeof data !== 'string' || !data) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(Buffer.from(data, 'base64')), {
    headers: {
      'Content-Type': 'image/webp',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
