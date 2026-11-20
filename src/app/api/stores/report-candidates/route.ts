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

  const rows: CandidateRow[] = data ?? [];
  const otherStoreIds = rows.filter((row) => row.store_type === 'other').map((row) => row.store_id);
  const logos = new Map<string, string>();
  if (otherStoreIds.length) {
    const { data: stores, error: logoError } = await supabase
      .from('stores')
      .select('id, logo_path')
      .in('id', otherStoreIds)
      .not('logo_path', 'is', null);

    if (logoError) {
      console.error('[api/stores/report-candidates] logo query failed', logoError);
    }

    for (const store of stores ?? []) {
      if (store.logo_path) {
        const { data: logo } = supabase.storage.from('store-logos').getPublicUrl(store.logo_path);
        logos.set(store.id, logo.publicUrl);
      }
    }
  }

  const candidates = rows.map((candidate) => ({
    storeId: candidate.store_id,
    storeName: candidate.store_name,
    storeType: candidate.store_type,
    address: candidate.address,
    province: candidate.province,
    district: candidate.district,
    logoUrl: logos.get(candidate.store_id) ?? null,
    distanceM: Math.max(0, Math.round(Number(candidate.distance_m))),
  }));

  return NextResponse.json({ candidates }, { headers: { 'Cache-Control': 'private, no-store' } });
}
