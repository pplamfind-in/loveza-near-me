import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { explorerLabelSx } from 'src/sections/home/explorer-styles';

export function ForumShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: { xs: 12, md: 13 }, pb: 6 }}>
      <Container maxWidth="lg">
        <Box
          component="section"
          sx={{
            position: 'relative',
            overflow: 'hidden',
            mb: 3,
            border: '5px solid var(--palette-background-paper)',
            borderRadius: '18px',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 0 var(--palette-grey-200)',
          }}
        >
          <Box
            component="img"
            src="/assets/loveza/login-welcome-v1.webp"
            alt=""
            width={1536}
            height={1024}
            sx={{
              position: 'absolute',
              inset: 0,
              width: 1,
              height: 1,
              objectFit: 'cover',
              objectPosition: 'right 55%',
              opacity: { xs: 0.25, md: 1 },
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, var(--palette-background-paper) 10%, rgba(255,253,250,.95) 40%, rgba(255,253,250,.1) 100%)',
            }}
          />
          <Box sx={{ position: 'relative', p: { xs: 2.5, md: 4 }, maxWidth: 620 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main' }}>
              <Iconify icon="ri:chat-smile-3-line" width={20} />
              <Typography sx={explorerLabelSx}>LOVEZA COMMUNITY</Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{ mt: 1.5, fontSize: { xs: 32, md: 40 }, fontWeight: 900, lineHeight: 1.4 }}
            >
              แวะคุยกัน ระหว่างทาง
            </Typography>
            <Typography
              sx={{
                mt: 1.25,
                maxWidth: 410,
                color: 'text.secondary',
                fontSize: 14,
                lineHeight: 1.85,
              }}
            >
              แชร์ร้านที่พบ รีวิวรสโปรด หรือถามเพื่อนนักสำรวจ
              <br />
              ทุกเรื่องเล่าช่วยให้ชุมชนของเราน่าอยู่ขึ้น
            </Typography>
            <Link
              href="/community-guidelines"
              underline="hover"
              sx={{
                mt: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Iconify icon="ri:heart-2-line" width={16} />
              อ่านแนวทางการพูดคุยในชุมชน
            </Link>
          </Box>
        </Box>
        {children}
      </Container>
    </Box>
  );
}
