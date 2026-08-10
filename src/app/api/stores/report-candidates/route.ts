import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

type CandidateRow = {
  store_id: string;
  store_name: string;
  store_type: string;
  address: string | null;
  province: string;
  district: string | null;
  distance_m: number;
};

const coordinate = (value: string | null) => (value === null ? Number.NaN : Number(value));

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const latitude = coordinate(url.searchParams.get('lat'));
  const longitude = coordinate(url.searchParams.get('lng'));

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

  const { data, error } = await supabase.rpc('report_nearby_store_candidates', {
    user_latitude: latitude,
    user_longitude: longitude,
  });

  if (error) {
    console.error('[api/stores/report-candidates] query failed', error);
    return NextResponse.json({ error: 'Candidate query failed' }, { status: 500 });
  }

  const candidates = (data ?? []).map((candidate: CandidateRow) => ({
    storeId: candidate.store_id,
    storeName: candidate.store_name,
    storeType: candidate.store_type,
    address: candidate.address,
    province: candidate.province,
    district: candidate.district,
    distanceM: Math.max(0, Math.round(Number(candidate.distance_m))),
  }));

  return NextResponse.json(
    { candidates },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
