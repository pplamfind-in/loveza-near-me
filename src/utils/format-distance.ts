export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null || Number.isNaN(distanceKm)) {
    return 'ไม่ทราบระยะทาง';
  }

  if (distanceKm < 1) {
    return `ห่างจากคุณ ${Math.round(distanceKm * 1000)} ม.`;
  }

  return `ห่างจากคุณ ${distanceKm.toFixed(1)} กม.`;
}
