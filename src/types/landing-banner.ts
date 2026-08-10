export type LandingBanner = {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url: string | null;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const DEFAULT_LANDING_BANNERS: LandingBanner[] = [
  {
    id: 'default-loveza-hero',
    title: 'Loveza Hero หลัก',
    image_url: '/assets/loveza/background-loveza.png',
    mobile_image_url: '/assets/loveza/background-loveza-mobile.png',
    alt_text: 'Loveza Love Potion vitamin soda รสน้ำผึ้งมะนาว ลิ้นจี่ และองุ่นเคียวโฮ',
    sort_order: 1,
    is_active: true,
  },
];
