import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';
import { STORE_LOGO_BUCKET } from 'src/lib/supabase/store-logo';

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
  const masterLogos = new Map<string, string | null>();
  const locations = new Map<
    string,
    { latitude: number; longitude: number; logoUrl: string | null }
  >();
  if (rows.length) {
    const [locationResult, masterResult] = await Promise.all([
      supabase
        .from('stores')
        .select('id, latitude, longitude, store_type, logo_path, merchant_logo_path')
        .in(
          'id',
          rows.map(({ store_id }) => store_id)
        )
        .eq('is_active', true),
      supabase
        .from('store_types')
        .select('code, logo_url')
        .in('code', [...new Set(rows.map(({ store_type }) => store_type))]),
    ]);
    if (locationResult.error)
      console.error('[api/stores/report-candidates] location query failed', locationResult.error);
    if (masterResult.error)
      console.error('[api/stores/report-candidates] logo query failed', masterResult.error);

    for (const type of masterResult.data ?? []) masterLogos.set(type.code, type.logo_url);

    for (const store of locationResult.data ?? []) {
      const path =
        store.merchant_logo_path ?? (store.store_type === 'other' ? store.logo_path : null);
      const logoUrl = path
        ? supabase.storage.from(STORE_LOGO_BUCKET).getPublicUrl(path).data.publicUrl
        : null;
      locations.set(store.id, { latitude: store.latitude, longitude: store.longitude, logoUrl });
    }
  }

  const candidates = rows.map((candidate) => ({
    storeId: candidate.store_id,
    storeName: candidate.store_name,
    storeType: candidate.store_type,
    address: candidate.address,
    province: candidate.province,
    district: candidate.district,
    latitude: locations.get(candidate.store_id)?.latitude ?? null,
    longitude: locations.get(candidate.store_id)?.longitude ?? null,
    logoUrl:
      locations.get(candidate.store_id)?.logoUrl ?? masterLogos.get(candidate.store_type) ?? null,
    distanceM: Math.max(0, Math.round(Number(candidate.distance_m))),
  }));

  return NextResponse.json({ candidates }, { headers: { 'Cache-Control': 'private, no-store' } });
}
