export type LovezaProduct = {
  id: string;
  name: string;
  thai_name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  color: string;
  accent: string;
  fruit: string;
  meta: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const DEFAULT_LOVEZA_PRODUCTS: LovezaProduct[] = [
  {
    id: 'honey-lemon',
    name: 'Honey Lemon',
    thai_name: 'รสน้ำผึ้งมะนาว',
    slug: 'honey-lemon',
    description: 'หอมสดชื่นด้วยน้ำผึ้งและมะนาว',
    image_url: null,
    color: '#00a9dc',
    accent: '#087cae',
    fruit: '🍋',
    meta: 'VITAMIN B3 • B6 • B12',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'lychee',
    name: 'Lychee',
    thai_name: 'รสลิ้นจี่',
    slug: 'lychee',
    description: 'หวานหอม สดชื่นในสไตล์ลิ้นจี่',
    image_url: null,
    color: '#ee2c82',
    accent: '#00a99d',
    fruit: '🫧',
    meta: 'VITAMIN B3 • B6 • B12',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'kyoho-grape',
    name: 'Kyoho Grape',
    thai_name: 'รสองุ่นเคียวโฮ',
    slug: 'kyoho-grape',
    description: 'รสองุ่นเคียวโฮ หอมเข้มเต็มรส',
    image_url: null,
    color: '#7245a3',
    accent: '#4d287e',
    fruit: '🍇',
    meta: 'VITAMIN B3 • B6 • B12',
    sort_order: 3,
    is_active: true,
  },
];
