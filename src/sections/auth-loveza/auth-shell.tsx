import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 2, md: 5 },
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: { xs: 'calc(100vh - 32px)', md: 'calc(100vh - 80px)' },
            display: 'grid',
            overflow: 'hidden',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '38px' },
            bgcolor: '#fff',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr .95fr' },
            boxShadow: '9px 10px 0 #351129',
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
            <Box
              sx={{
                inset: 0,
                position: 'absolute',
                background:
                  'linear-gradient(180deg, rgba(229,0,126,.05) 10%, rgba(229,0,126,.92) 100%)',
              }}
            />
            <Box sx={{ zIndex: 1, color: '#fff' }}>
              <Typography
                sx={{
                  px: 1.5,
                  py: 0.7,
                  width: 'fit-content',
                  color: '#351129',
                  fontSize: 11,
                  fontWeight: 1000,
                  letterSpacing: 2,
                  border: '2px solid #351129',
                  borderRadius: 99,
                  bgcolor: '#FDE047',
                  boxShadow: '3px 3px 0 #351129',
                  transform: 'rotate(-2deg)',
                }}
              >
                LOVEZA NEAR ME
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 440,
                  fontSize: { xs: 32, md: 48 },
                  lineHeight: 1.05,
                  fontWeight: 900,
                }}
              >
                Login แล้วไปล่า Loveza กัน!
              </Typography>
            </Box>
          </Box>

          <Stack justifyContent="center" sx={{ minWidth: 0, p: { xs: 3, sm: 5, md: 7 } }}>
            <Logo sx={{ width: 68, height: 64, alignSelf: 'flex-start' }} />
            <Typography
              sx={{ mt: 6, color: '#E5007E', fontSize: 12, fontWeight: 1000, letterSpacing: 2 }}
            >
              {eyebrow}
            </Typography>
            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                color: '#351129',
                fontSize: { xs: 34, sm: 40, md: 48 },
                lineHeight: 1.08,
                fontWeight: 1000,
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
