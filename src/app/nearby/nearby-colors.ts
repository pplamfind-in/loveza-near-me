export type NearbyStoreColor = {
  main: string;
  dark: string;
  soft: string;
};

export const LOVEZA_STORE_COLORS: NearbyStoreColor[] = [
  { main: '#427653', dark: '#305C3D', soft: '#E8F0E4' },
  { main: '#AC7628', dark: '#80551D', soft: '#FBF0CD' },
  { main: '#538497', dark: '#345D70', soft: '#EAF2F5' },
  { main: '#B57751', dark: '#855136', soft: '#F7ECE0' },
  { main: '#698452', dark: '#4B6239', soft: '#EDF1E4' },
  { main: '#4C8981', dark: '#32645D', soft: '#E7F2EE' },
];

export function getNearbyStoreColor(storeId: string) {
  let hash = 0;

  for (let index = 0; index < storeId.length; index += 1) {
    hash = (hash * 31 + storeId.charCodeAt(index)) % 2_147_483_647;
  }

  return LOVEZA_STORE_COLORS[hash % LOVEZA_STORE_COLORS.length];
}
