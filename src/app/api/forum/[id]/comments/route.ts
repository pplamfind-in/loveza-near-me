import { NextResponse } from 'next/server';

import { idSchema } from 'src/app/forum/schema';
import { getCommentPage, commentCursorSchema } from 'src/lib/supabase/forum-comments';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: 'กระทู้ไม่ถูกต้อง' }, { status: 400 });
  const search = new URL(request.url).searchParams;
  const parentId = search.get('parentId') || undefined;
  if (parentId && !idSchema.safeParse(parentId).success)
    return NextResponse.json({ error: 'ความคิดเห็นต้นทางไม่ถูกต้อง' }, { status: 400 });
  const raw = search.get('cursor');
  let cursor;
  if (raw) {
    try {
      cursor = commentCursorSchema.parse(JSON.parse(raw));
    } catch {
      return NextResponse.json({ error: 'ตำแหน่งความคิดเห็นไม่ถูกต้อง' }, { status: 400 });
    }
  }
  try {
    return NextResponse.json(await getCommentPage(id, cursor, parentId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'โหลดความคิดเห็นไม่สำเร็จ' }, { status: 500 });
  }
}
