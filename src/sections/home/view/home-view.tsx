import type { LatestStorePreview } from 'src/types/store';
import type { LandingBanner } from 'src/types/landing-banner';
import type { LovezaProduct } from 'src/types/loveza-product';

import Box from '@mui/material/Box';

import { HeroSection } from '../hero-section';
import { FooterSection } from '../footer-section';
import { FinderSection } from '../finder-section';
import { FlavorsSection } from '../flavors-section';
import { HighlightsSection } from '../highlights-section';
import { StorySection, AdventureSection } from '../story-section';

type HomeViewProps = {
  products: LovezaProduct[];
  banners: LandingBanner[];
  latestStores: LatestStorePreview[];
  brandOwnerAcknowledged: boolean;
};

export function HomeView({ products, latestStores, brandOwnerAcknowledged }: HomeViewProps) {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        width: 1,
        '& .MuiButton-root': { borderRadius: '12px' },
        '& .MuiButton-containedPrimary': {
          boxShadow: '0 4px 0 var(--palette-primary-darker)',
          '&:hover': { boxShadow: '0 2px 0 var(--palette-primary-darker)' },
        },
        '& [id]': { scrollMarginTop: { xs: 80, md: 96 } },
        '& a:focus-visible': { outline: '3px solid var(--palette-primary-main)', outlineOffset: 5 },
        '@media (prefers-reduced-motion: reduce)': {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },
        color: 'var(--palette-text-primary)',
        background: 'var(--palette-background-default)',
      }}
    >
      <HeroSection />
      <HighlightsSection />
      <StorySection />
      <FinderSection latestStores={latestStores} />
      <FlavorsSection products={products} />
      <AdventureSection />
      <FooterSection brandOwnerAcknowledged={brandOwnerAcknowledged} />
    </Box>
  );
}
