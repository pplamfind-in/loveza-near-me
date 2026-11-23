import Image from 'next/image';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { POINTS_PER_STORE } from 'src/lib/explorer/progress';

import { Iconify } from 'src/components/iconify';

const coinAsset = '/assets/loveza/loveza-coin.webp';

import { landingCardRadius } from './explorer-styles';

export function MissionSection() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        component="section"
        aria-labelledby="home-mission-title"
        sx={{
          position: 'relative',
          p: { xs: 3, sm: 4, lg: 6 },
          overflow: 'hidden',
          border: '5px solid var(--palette-background-paper)',
          borderRadius: landingCardRadius,
          background: 'linear-gradient(125deg, #FFF3D4 4%, #F6F2DB 46%, #E1EFE1 100%)',
          boxShadow: '0 4px 0 var(--palette-grey-200)',
          display: 'grid',
          gap: { xs: 3, sm: 4, lg: 6 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 3fr) minmax(0, 2fr)' },
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            id="home-mission-title"
            component="h2"
            sx={{
              fontSize: { xs: 29, sm: 36, lg: 44 },
              lineHeight: 1.24,
              fontWeight: 900,
              color: 'primary.darker',
            }}
          >
            ทุกหมุดมีเรื่องราว
            <br />
            <Box component="span" sx={{ color: 'text.primary' }}>
              ทุกคนเป็นนักสำรวจ
            </Box>
          </Typography>
          <Typography
            sx={{
              mt: 2,
              maxWidth: '44ch',
              color: 'text.secondary',
              fontSize: 16,
              lineHeight: 1.75,
            }}
          >
            ร่วมแจ้งร้าน Loveza ที่พบ ทำภารกิจและเลื่อนเลเวลไปด้วยกัน
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image src={coinAsset} alt="" width={48} height={44} unoptimized />
            <Typography sx={{ color: 'primary.darker', fontSize: 14 }}>
              <Box component="strong" sx={{ fontSize: 17, fontWeight: 900 }}>
                {POINTS_PER_STORE} เหรียญ
              </Box>{' '}
              ต่อร้านไม่ซ้ำที่ผ่านอนุมัติ
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
              width: { sm: 'fit-content' },
              maxWidth: '100%',
              gap: 1.5,
              mt: 3,
              '& .MuiButton-root': { minHeight: 48, px: 3 },
            }}
          >
            <Button
              href="/account/"
              variant="contained"
              endIcon={<Iconify icon="ri:arrow-right-line" />}
            >
              ไปดูภารกิจของฉัน
            </Button>
            <Button
              href="/rewards/"
              variant="outlined"
              startIcon={<Iconify icon="ri:gift-2-line" />}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: '0 4px 0 var(--palette-primary-darker)',
                '&:hover': { boxShadow: '0 2px 0 var(--palette-primary-darker)' },
              }}
            >
              รางวัลภารกิจ
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            gridRow: { xs: 1, md: 'auto' },
            minWidth: 0,
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              aspectRatio: '1312 / 1199',
              background: `url(${coinAsset}) center / contain no-repeat`,
              pointerEvents: 'none',
            },
            '&::before': {
              width: { xs: '43%', md: '47%' },
              maxWidth: 200,
              top: '5%',
              right: { xs: '1%', sm: '15%', md: 0 },
              opacity: 0.3,
              transform: 'rotate(18deg)',
            },
            '&::after': {
              width: '29%',
              maxWidth: 120,
              bottom: '13%',
              left: { xs: 0, sm: '15%', md: 0 },
              opacity: 0.23,
              transform: 'rotate(-23deg)',
            },
          }}
        >
          <Image
            src="/assets/illustrations/p-jazz.webp"
            unoptimized
            alt=""
            width={1199}
            height={1312}
            style={{
              width: 'min(100%, clamp(180px, 32vw, 310px))',
              height: 'auto',
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 14px 12px rgba(66,118,83,.17))',
            }}
          />
        </Box>
      </Box>
    </Container>
  );
}
