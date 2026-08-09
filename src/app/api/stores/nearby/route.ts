import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

type StoreCredit = { store_id: string; reporter_display_name: string | null };

const coordinate = (value: string | null) => (value === null ? Number.NaN : Number(value));

export async function GET(request: Request) {
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

  const supabase = await createClient();
  const { data: radiusSetting, error: radiusError } = await supabase.rpc('nearby_search_radius_m');
  const radiusM = Number(radiusSetting);

  if (radiusError || !Number.isInteger(radiusM) || radiusM <= 0) {
    console.error('[api/stores/nearby] radius setting failed', radiusError);
    return NextResponse.json({ error: 'Search radius unavailable' }, { status: 500 });
  }

  const { data, error } = await supabase.rpc('nearby_stores', {
    user_latitude: latitude,
    user_longitude: longitude,
    radius_km: radiusM / 1_000,
  });

  if (error) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  const storeIds = (data ?? []).map((store: { id: string }) => store.id);
  const [storeRowsResult, creditsResult] = await Promise.all([
    storeIds.length
      ? supabase.from('stores').select('id, store_type').in('id', storeIds)
      : Promise.resolve({ data: [], error: null }),
    storeIds.length
      ? supabase.rpc('nearby_store_reporter_credits', { store_ids: storeIds })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const { data: storeRows, error: storeRowsError } = storeRowsResult;
  if (storeRowsError) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
  if (creditsResult.error) {
    console.error('[api/stores/nearby] reporter credits query failed', creditsResult.error);
  }

  const typeCodes = [...new Set((storeRows ?? []).map((store) => store.store_type))];
  const { data: storeTypes, error: storeTypesError } = typeCodes.length
    ? await supabase.from('store_types').select('code, logo_url').in('code', typeCodes)
    : { data: [], error: null };
  if (storeTypesError) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  const typesByStoreId = new Map((storeRows ?? []).map((store) => [store.id, store.store_type]));
  const logosByType = new Map((storeTypes ?? []).map((item) => [item.code, item.logo_url]));
  const creditsByStoreId = new Map(
    (creditsResult.data ?? []).map((credit: StoreCredit) => [
      credit.store_id,
      credit.reporter_display_name,
    ])
  );
  const stores = (data ?? []).map((store: { id: string }) => {
    const storeType = typesByStoreId.get(store.id) ?? 'unknown';
    return {
      ...store,
      store_type: storeType,
      store_type_logo_url: logosByType.get(storeType) ?? null,
      reporter_display_name: creditsByStoreId.get(store.id) ?? null,
    };
  });

  return NextResponse.json(
    { stores, radiusM },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
