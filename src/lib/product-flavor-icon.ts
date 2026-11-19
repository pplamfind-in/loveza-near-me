import type { LovezaProduct } from 'src/types/loveza-product';

const flavorIcons: Record<string, string> = {
  'honey-lemon': '/assets/loveza/loveza-lemon.webp',
  lychee: '/assets/loveza/loveza-lychee.webp',
  'kyoho-grape': '/assets/loveza/loveza-grape.webp',
  yogurt: '/assets/loveza/loveza-yogurt.webp',
  yoghurt: '/assets/loveza/loveza-yogurt.webp',
};

export function getProductFlavorIcon(product: Pick<LovezaProduct, 'slug' | 'icon_url'>) {
  return product.icon_url || flavorIcons[product.slug];
}
