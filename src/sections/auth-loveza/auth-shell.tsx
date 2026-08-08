import Link from 'next/link';
import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#f7fbfb', py: { xs: 2, md: 5 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: { xs: 'calc(100vh - 32px)', md: 'calc(100vh - 80px)' },
            display: 'grid',
            overflow: 'hidden',
            borderRadius: { xs: '28px', md: '42px' },
            bgcolor: '#fff',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr .95fr' },
            boxShadow: '0 30px 90px rgba(43,87,98,.14)',
          }}
        >
          <Box
            sx={{
              minHeight: { xs: 260, md: 'auto' },
              display: 'flex',
              overflow: 'hidden',
              position: 'relative',
              alignItems: 'flex-end',
              p: { xs: 3, md: 5 },
            }}
          >
            <Image
              fill
              priority
              sizes="(max-width: 900px) 100vw, 55vw"
              src="/assets/loveza/loveza-hero-v2.png"
              alt="Loveza Love Potion"
              style={{ objectFit: 'cover', objectPosition: '68% center' }}
            />
            <Box sx={{ inset: 0, position: 'absolute', background: 'linear-gradient(180deg, transparent 20%, rgba(71,31,95,.8) 100%)' }} />
            <Box sx={{ zIndex: 1, color: '#fff' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>LOVEZA NEAR ME</Typography>
              <Typography sx={{ mt: 1, maxWidth: 440, fontSize: { xs: 28, md: 42 }, lineHeight: 1.05, fontWeight: 900 }}>
                ช่วยกันเจอ ช่วยกันบอกต่อ
              </Typography>
            </Box>
          </Box>

          <Stack justifyContent="center" sx={{ minWidth: 0, p: { xs: 3, sm: 5, md: 7 } }}>
            <Link href="/" style={{ alignSelf: 'flex-start', color: '#00a99d', textDecoration: 'none', fontWeight: 1000, fontSize: 22 }}>
              LOVE ZA<span style={{ color: '#ef2382' }}>!</span>
            </Link>
            <Typography sx={{ mt: 6, color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
              {eyebrow}
            </Typography>
            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                color: '#262b2a',
                fontSize: { xs: 34, sm: 40, md: 48 },
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: '-.05em',
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ mt: 2, color: '#707978', lineHeight: 1.7 }}>{description}</Typography>
            <Box sx={{ mt: 4 }}>{children}</Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
