export type NearbyStoreColor = {
  main: string;
  dark: string;
  soft: string;
};

export const LOVEZA_STORE_COLORS: NearbyStoreColor[] = [
  { main: '#18a9df', dark: '#087da8', soft: '#e8f8ff' },
  { main: '#E5007E', dark: '#bd155f', soft: '#fff0f7' },
  { main: '#7b43a1', dark: '#572676', soft: '#f7efff' },
  { main: '#f1b51d', dark: '#b77d00', soft: '#fff8dc' },
  { main: '#25b77a', dark: '#128356', soft: '#eafbf4' },
  { main: '#f47a34', dark: '#bd4d12', soft: '#fff1e8' },
];

export function getNearbyStoreColor(storeId: string) {
  let hash = 0;

  for (let index = 0; index < storeId.length; index += 1) {
    hash = (hash * 31 + storeId.charCodeAt(index)) % 2_147_483_647;
  }

  return LOVEZA_STORE_COLORS[hash % LOVEZA_STORE_COLORS.length];
}
