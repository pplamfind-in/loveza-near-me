import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const amount = body?.amount;
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return NextResponse.json({ error: 'Invalid like batch' }, { status: 400 });
  }

  const db = await createClient();
  const { data, error } = await db.rpc('add_product_likes', {
    target_product_id: id,
    amount,
  });

  if (error?.code === '42501') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (error) {
    return NextResponse.json({ error: 'Could not save likes' }, { status: 500 });
  }
  if (data === null) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ count: Number(data) });
}
