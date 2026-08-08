import Box from '@mui/material/Box';

import { HeroSection } from '../hero-section';
import { StorySection } from '../story-section';
import { FooterSection } from '../footer-section';
import { FinderSection } from '../finder-section';
import { FlavorsSection } from '../flavors-section';

export function HomeView() {
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
      <StorySection />
      <FlavorsSection />
      <FinderSection />
      <FooterSection />
    </Box>
  );
}
