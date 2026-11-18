type FlavorReport = {
  approval_status: string;
  stock_status: string;
  flavors: string[];
  created_at: string;
};

export const normalizeFlavor = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
  return normalized === 'yogurt' ? 'yoghurt' : normalized;
};

export function collectFoundFlavors(reports: FlavorReport[]) {
  const found = new Map<string, string>();
  for (const report of reports) {
    if (
      report.approval_status !== 'approved' ||
      !['available', 'low_stock'].includes(report.stock_status)
    )
      continue;
    const timestamp = new Date(report.created_at).getTime();
    if (!Number.isFinite(timestamp)) continue;
    for (const flavor of report.flavors ?? []) {
      const key = normalizeFlavor(flavor);
      if (!key || key === 'unknown') continue;
      const previous = found.get(key);
      if (!previous || timestamp < new Date(previous).getTime()) found.set(key, report.created_at);
    }
  }
  return found;
}
