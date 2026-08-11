import { z } from 'zod';
import { NextResponse } from 'next/server';

import { requireAdminClient } from 'src/lib/supabase/require-admin';

type ReportImageRouteContext = {
  params: Promise<{ id: string }>;
};

function getAllowedReportImageUrl(value: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const imageUrl = new URL(value);
    const configuredSupabaseUrl = new URL(supabaseUrl);
    const isAllowed =
      imageUrl.protocol === 'https:' &&
      imageUrl.origin === configuredSupabaseUrl.origin &&
      imageUrl.pathname.startsWith('/storage/v1/object/public/report-images/');

    return isAllowed ? imageUrl : null;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: ReportImageRouteContext) {
  const { supabase, user } = await requireAdminClient();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'รหัสรูปภาพไม่ถูกต้อง' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reports')
    .select('photo_url')
    .eq('id', id)
    .not('photo_url', 'is', null)
    .single();

  if (error || !data?.photo_url) {
    return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 404 });
  }

  const imageUrl = getAllowedReportImageUrl(data.photo_url);
  if (!imageUrl) {
    return NextResponse.json({ error: 'URL รูปภาพไม่ถูกต้อง' }, { status: 400 });
  }

  let imageResponse: Response;
  try {
    imageResponse = await fetch(imageUrl, { cache: 'no-store' });
  } catch {
    return NextResponse.json({ error: 'โหลดรูปภาพไม่สำเร็จ' }, { status: 502 });
  }

  if (!imageResponse.ok || !imageResponse.body) {
    return NextResponse.json({ error: 'โหลดรูปภาพไม่สำเร็จ' }, { status: 502 });
  }

  const contentType = imageResponse.headers.get('content-type');
  if (!contentType?.startsWith('image/')) {
    return NextResponse.json({ error: 'ไฟล์นี้ไม่ใช่รูปภาพ' }, { status: 415 });
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=300',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
  });
  const contentLength = imageResponse.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new Response(imageResponse.body, { headers });
}
