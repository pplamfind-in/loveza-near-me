import type { LandingBanner } from 'src/types/landing-banner';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { HeroBannerMedia } from './hero-banner-media';

type HeroSectionProps = {
  banners: LandingBanner[];
};

export function HeroSection({ banners }: HeroSectionProps) {
  return (
    <Container maxWidth="xl">
      <Box component="section" id="home" sx={{ pt: '100px', pb: { xs: 0, md: 4 } }}>
        <Box
          sx={{
            minHeight: { xs: 780, sm: 820, md: 720 },
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            border: { xs: '2px solid #351129', md: '3px solid #351129' },
            borderRadius: { xs: '26px', md: '40px' },
            bgcolor: '#E5007E',
            boxShadow: { xs: '5px 6px 0 #351129', md: '10px 12px 0 #351129' },
            '& img': {
              width: '100% !important',
              height: { xs: '380px !important', sm: '430px !important', md: '100% !important' },
              objectFit: 'cover',
              objectPosition: { xs: '68% center', sm: '66% center', md: 'center' },
            },
          }}
        >
          <HeroBannerMedia banners={banners} />

          <Box
            sx={{
              inset: 0,
              position: 'absolute',
              background: {
                xs: 'linear-gradient(180deg, rgba(229,0,126,0) 0%, rgba(229,0,126,0) 37%, rgba(229,0,126,.72) 44%, #E5007E 49%, #E5007E 100%)',
                md: 'linear-gradient(90deg, #E5007E 0%, #E5007E 2%, rgba(229,0,126,.84) 5%, rgba(229,0,126,0) 66%)',
              },
            }}
          />

          <Container
            maxWidth="xl"
            sx={{
              zIndex: 1,
              display: 'flex',
              alignItems: { xs: 'flex-end', md: 'center' },
              py: { xs: 3, sm: 4, md: 7.5 },
            }}
          >
            <Box sx={{ width: 1, maxWidth: 650, color: '#fff' }}>
              <Box
                sx={{
                  mb: 2.5,
                  px: 1.5,
                  py: 0.8,
                  gap: 0.8,
                  width: 'fit-content',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 99,
                  color: '#351129',
                  border: '2px solid #351129',
                  bgcolor: '#FDE047',
                  boxShadow: '3px 3px 0 #351129',
                  transform: 'rotate(-2deg)',
                }}
              >
                <Iconify icon="ri:sparkling-2-fill" width={16} />
                <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2 }}>
                  LOVEZA SODA • 330 ML
                </Typography>
              </Box>

              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 54, sm: 78, md: 92 },
                  fontWeight: 900,
                  lineHeight: { xs: 0.9, md: 0.9 },
                  letterSpacing: '-0.075em',
                  textShadow: '4px 5px 0 rgba(53,17,41,.22)',
                }}
              >
                LOVEZA
                <Box component="span" sx={{ display: 'block', color: '#FDE047' }}>
                  อยู่ไหนอะ?!
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: { xs: 2, md: 3 },
                  maxWidth: { xs: 330, sm: 470 },
                  color: '#FFF5FA',
                  fontSize: { xs: 15, md: 17 },
                  lineHeight: 1.7,
                  overflowWrap: 'anywhere',
                }}
              >
                เปิดแมปแล้วออกล่า! เช็กร้านใกล้ตัว จำนวนที่เหลือ และพิกัดล่าสุดจากแก๊ง Loveza
                Community
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ mt: { xs: 2.5, md: 4 }, maxWidth: { xs: 330, sm: 'none' } }}
              >
                <Button
                  href="/nearby"
                  variant="contained"
                  startIcon={<Iconify icon="ri:map-pin-2-fill" />}
                  sx={{
                    px: 3.25,
                    py: 1.4,
                    color: '#351129',
                    border: '2px solid #351129',
                    borderRadius: 99,
                    backgroundImage: 'none',
                    bgcolor: '#FDE047',
                    boxShadow: '4px 5px 0 #351129',
                    '&:hover': {
                      bgcolor: '#FFE96B',
                      boxShadow: '2px 3px 0 #351129',
                    },
                  }}
                >
                  ตามหา Loveza ใกล้ฉัน
                </Button>
                <Button
                  href="/report"
                  startIcon={<Iconify icon="ri:edit-2-fill" />}
                  sx={{
                    color: '#351129',
                    border: '2px solid #351129',
                    borderRadius: 99,
                    px: 2.5,
                    bgcolor: '#fff',
                    boxShadow: '4px 5px 0 #351129',
                    '&:hover': { bgcolor: '#FFEAF5', boxShadow: '2px 3px 0 #351129' },
                  }}
                >
                  เจอแล้ว แจ้งพิกัด
                </Button>
              </Stack>
            </Box>
          </Container>

          <Box
            sx={{
              top: 28,
              right: 30,
              zIndex: 2,
              px: 2,
              py: 1.25,
              display: { xs: 'none', lg: 'flex' },
              gap: 1.1,
              position: 'absolute',
              alignItems: 'center',
              borderRadius: 99,
              color: '#351129',
              border: '2px solid #351129',
              bgcolor: '#70E1F5',
              boxShadow: '4px 5px 0 #351129',
              transform: 'rotate(2deg)',
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                bgcolor: '#E5007E',
                boxShadow: '0 0 0 5px rgba(229,0,126,.12)',
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
              3 รสชาติ • พร้อมส่งต่อความซ่า
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
