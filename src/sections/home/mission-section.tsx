import Image from 'next/image';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

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
          borderRadius: '28px',
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
            ร่วมแจ้งร้าน Loveza ที่พบ รับ 10 แต้มต่อร้านไม่ซ้ำที่ผ่านอนุมัติ
            ทำภารกิจและเลื่อนเลเวลไปด้วยกัน
          </Typography>
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
              filter: 'drop-shadow(0 14px 12px rgba(66,118,83,.17))',
            }}
          />
        </Box>
      </Box>
    </Container>
  );
}
