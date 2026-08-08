import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

const coordinate = (value: string | null) => (value === null ? Number.NaN : Number(value));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = coordinate(url.searchParams.get('lat'));
  const longitude = coordinate(url.searchParams.get('lng'));
  const radius = Math.min(Math.max(Number(url.searchParams.get('radius') ?? 25), 1), 100);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('nearby_stores', {
    user_latitude: latitude,
    user_longitude: longitude,
    radius_km: Number.isFinite(radius) ? radius : 25,
  });

  if (error) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  return NextResponse.json({ stores: data ?? [] });
}
