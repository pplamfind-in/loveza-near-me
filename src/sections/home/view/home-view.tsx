import type { LovezaProduct } from 'src/types/loveza-product';

import Box from '@mui/material/Box';

import { HeroSection } from '../hero-section';
import { StorySection } from '../story-section';
import { FooterSection } from '../footer-section';
import { FinderSection } from '../finder-section';
import { FlavorsSection } from '../flavors-section';

type HomeViewProps = {
  products: LovezaProduct[];
};

export function HomeView({ products }: HomeViewProps) {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        bgcolor: '#fffdf8',
        color: '#172113',
        fontFamily: "'DM Sans Variable', 'LINE Seed Sans TH', sans-serif",
      }}
    >
      <HeroSection />
      <FinderSection />
      <FlavorsSection products={products} />
      <StorySection />
      <FooterSection />
    </Box>
  );
}
