import type { LovezaProduct } from 'src/types/loveza-product';

import Box from '@mui/material/Box';

import { HeroSection } from '../hero-section';
import { StorySection } from '../story-section';
import { FooterSection } from '../footer-section';
import { FinderSection } from '../finder-section';
import { FlavorsSection } from '../flavors-section';
import { HighlightsSection } from '../highlights-section';

type HomeViewProps = {
  products: LovezaProduct[];
};

export function HomeView({ products }: HomeViewProps) {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        color: '#351129',
        fontFamily: "'DM Sans Variable', 'LINE Seed Sans TH', sans-serif",
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.09) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <HeroSection />
      <HighlightsSection />
      <FlavorsSection products={products} />
      <FinderSection />
      <StorySection />
      <FooterSection />
    </Box>
  );
}
