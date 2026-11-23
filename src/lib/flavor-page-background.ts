export function flavorPageBackground(color: string) {
  return `radial-gradient(ellipse at 25% 32%, #fff7dc 0%, transparent 48%),
    linear-gradient(180deg, color-mix(in srgb, ${color} 20.8%, transparent) 0%,
      color-mix(in srgb, ${color} 7.1%, transparent) 60%, #FBF6ED 100%)`;
}
