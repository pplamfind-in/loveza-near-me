import type { LatestStorePreview } from 'src/types/store';
import type { LandingBanner } from 'src/types/landing-banner';
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
  banners: LandingBanner[];
  latestStores: LatestStorePreview[];
  brandOwnerAcknowledged: boolean;
};

export function HomeView({
  products,
  banners,
  latestStores,
  brandOwnerAcknowledged,
}: HomeViewProps) {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        color: '#351129',
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.09) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <HeroSection banners={banners} />
      <HighlightsSection />
      <FlavorsSection products={products} />
      <FinderSection latestStores={latestStores} />
      <StorySection />
      <FooterSection brandOwnerAcknowledged={brandOwnerAcknowledged} />
    </Box>
  );
}
