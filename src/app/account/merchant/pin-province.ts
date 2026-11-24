import type { Polygon, Position, MultiPolygon, FeatureCollection } from 'geojson';

import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

import provinceNames from '../../../../public/assets/data/thailand-province-names.json';

const provinceKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const namesByKey = new Map(
  provinceNames.map((name) => [provinceKey(name.provinceNameEn), name.provinceNameTh])
);
namesByKey.set('bangkokmetropolis', 'กรุงเทพมหานคร');
namesByKey.set('lopburi', 'ลพบุรี');

function isInRing(ring: Position[], latitude: number, longitude: number) {
  let inside = false;
  for (let i = 0, previous = ring.length - 1; i < ring.length; previous = i, i += 1) {
    const [x, y] = ring[i];
    const [px, py] = ring[previous];
    if (y > latitude !== py > latitude && longitude < ((px - x) * (latitude - y)) / (py - y) + x) {
      inside = !inside;
    }
  }
  return inside;
}

export async function getPinProvince(latitude: number, longitude: number) {
  const raw = await readFile(
    join(process.cwd(), 'public/assets/data/thailand-provinces.geojson'),
    'utf8'
  );
  const provinces = JSON.parse(raw) as FeatureCollection<
    Polygon | MultiPolygon,
    { NAME_1: string }
  >;

  const province = provinces.features.find(({ geometry }) => {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.some(
      ([outer, ...holes]) =>
        isInRing(outer, latitude, longitude) &&
        !holes.some((hole) => isInRing(hole, latitude, longitude))
    );
  });
  return province ? namesByKey.get(provinceKey(province.properties.NAME_1)) : undefined;
}
