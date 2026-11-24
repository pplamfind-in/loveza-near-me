import type { ReactNode } from 'react';
import type { LatestStorePreview } from 'src/types/store';
import type { LandingBanner } from 'src/types/landing-banner';
import type { LovezaProduct } from 'src/types/loveza-product';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { HeroSection } from '../hero-section';
import { FooterSection } from '../footer-section';
import { FinderSection } from '../finder-section';
import { MissionSection } from '../mission-section';
import { FlavorsSection } from '../flavors-section';
import { InstagramProfile } from '../instagram-profile';
import { ProtectedHomeImages } from '../protected-images';
import { HighlightsSection } from '../highlights-section';
import { StorySection, AdventureSection } from '../story-section';
import { explorerCardSx, landingCardRadius } from '../explorer-styles';

type HomeViewProps = {
  limitedMissions: ReactNode;
  flavorPolls: ReactNode;
  products: LovezaProduct[];
  banners: LandingBanner[];
  latestStores: LatestStorePreview[];
  brandOwnerAcknowledged: boolean;
  advertisingContactEnabled: boolean;
};

const ownerInstagramUrl = 'https://www.instagram.com/sungstarwin/';

export function HomeView({
  limitedMissions,
  flavorPolls,
  products,
  latestStores,
  brandOwnerAcknowledged,
  advertisingContactEnabled,
}: HomeViewProps) {
  return (
    <ProtectedHomeImages>
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
          '& a:focus-visible': {
            outline: '3px solid var(--palette-primary-main)',
            outlineOffset: 5,
          },
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
        <FlavorsSection products={products} />
        <FinderSection latestStores={latestStores} />
        {flavorPolls}
        {limitedMissions}
        <MissionSection />
        <HighlightsSection />
        <StorySection />
        <AdventureSection />
        <Container maxWidth="lg" sx={{ mb: { xs: 5, md: 8 } }}>
          <Stack
            component="section"
            aria-labelledby="sell-loveza-title"
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            spacing={{ xs: 3, md: 5 }}
            sx={{
              ...explorerCardSx,
              borderRadius: landingCardRadius,
              border: '5px solid',
              borderColor: 'common.white',
              p: { xs: 3, md: 5 },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <Box sx={{ width: { xs: 160, md: 200 }, maxWidth: 1, mb: 2 }}>
                <Image
                  src="/assets/illustrations/p-sung-kard.webp"
                  alt="ภาพการ์ดคุณซุง"
                  width={1183}
                  height={1329}
                  sizes="(min-width: 900px) 200px, 160px"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </Box>
              <Typography
                id="sell-loveza-title"
                component="h2"
                sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 900, lineHeight: 1.4 }}
              >
                สนใจขายน้ำ LOVEZA ที่ร้านของคุณ?
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                สอบถามเรื่องการขายน้ำ LOVEZA ได้ที่ Instagram ของเจ้าของแบรนด์
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                ทีม Loveza Hunt ขออนุญาตแสดงโปรไฟล์ Instagram ของคุณซุงบนเว็บไซต์นี้
                เพื่อให้ผู้สนใจขายน้ำ LOVEZA เข้าถึงช่องทางติดต่อได้สะดวก
              </Typography>
              <Button
                href={ownerInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                sx={{ mt: 3 }}
              >
                เปิด Instagram @sungstarwin
              </Button>
            </Box>
            <InstagramProfile url={ownerInstagramUrl} />
          </Stack>
        </Container>
        {advertisingContactEnabled && (
          <Container maxWidth="lg" sx={{ mb: { xs: 5, md: 8 } }}>
            <Stack
              component="section"
              aria-labelledby="advertising-contact-title"
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{
                ...explorerCardSx,
                borderRadius: landingCardRadius,
                border: '5px solid',
                borderColor: 'common.white',
                p: { xs: 3, md: 4 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  display: 'grid', placeItems: 'center', flexShrink: 0, width: 48, height: 48,
                  borderRadius: 1.5, bgcolor: 'primary.lighter', color: 'primary.dark',
                }}>
                  <Iconify icon="ri:megaphone-line" width={24} />
                </Box>
                <Box>
                  <Typography id="advertising-contact-title" component="h2" variant="h5">
                    พื้นที่โฆษณา
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    สนใจติดต่อ
                  </Typography>
                </Box>
              </Stack>
              <Button
                href="/contact-us/?topic=advertising#contact-form"
                variant="contained"
                startIcon={<Iconify icon="ri:mail-line" />}
                sx={{ flexShrink: 0 }}
              >
                ติดต่อลงโฆษณา
              </Button>
            </Stack>
          </Container>
        )}
        <FooterSection brandOwnerAcknowledged={brandOwnerAcknowledged} />
      </Box>
    </ProtectedHomeImages>
  );
}
