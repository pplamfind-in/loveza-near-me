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
        py: { xs: 1.5, sm: 3, md: 5 },
        overflow: 'hidden',
        position: 'relative',
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.12) 2px, transparent 2.5px) 0 0 / 28px 28px, linear-gradient(145deg, #FFF1F8 0%, #FFF9D9 52%, #E6FAFF 100%)',
        '&::before': {
          content: '""',
          width: 280,
          height: 280,
          top: -140,
          right: -100,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'rgba(229,0,126,.12)',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ zIndex: 1, position: 'relative' }}>
        <Box
          sx={{
            minHeight: { xs: 'calc(100vh - 24px)', sm: 'calc(100vh - 48px)', md: 680 },
            display: 'grid',
            overflow: 'hidden',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '38px' },
            bgcolor: '#fff',
            gridTemplateColumns: { xs: '1fr', md: '1.02fr .98fr' },
            boxShadow: '9px 10px 0 #351129',
          }}
        >
          <Box
            sx={{
              minHeight: { xs: 225, sm: 280, md: 'auto' },
              display: 'flex',
              overflow: 'hidden',
              position: 'relative',
              alignItems: 'flex-end',
              p: { xs: 2.5, sm: 3.5, md: 5 },
            }}
          >
            <Image
              fill
              priority
              sizes="(max-width: 900px) 100vw, 55vw"
              src="/assets/loveza/background-loveza-mobile.png"
              alt="Loveza Hunt เครื่องดื่ม Loveza ทั้งสามรสชาติ"
              style={{ objectFit: 'cover', objectPosition: 'center center' }}
            />
            <Box
              sx={{
                inset: 0,
                position: 'absolute',
                background:
                  'linear-gradient(180deg, rgba(53,17,41,.02) 12%, rgba(53,17,41,.15) 50%, rgba(229,0,126,.94) 100%)',
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
                LOVEZA HUNT
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 440,
                  fontSize: { xs: 28, sm: 34, md: 50 },
                  lineHeight: 1.05,
                  fontWeight: 900,
                }}
              >
                Login หนึ่งครั้ง
                <Box component="span" sx={{ display: 'block', color: '#FDE047' }}>
                  ล่าได้ทั่วไทย
                </Box>
              </Typography>
              <Stack
                direction="row"
                spacing={0.8}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 1.5, display: { xs: 'none', sm: 'flex' } }}
              >
                {['ค้นหาร้านใกล้ฉัน', 'แชร์พิกัดให้แก๊ง'].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      px: 1.25,
                      py: 0.6,
                      fontSize: 11,
                      fontWeight: 900,
                      borderRadius: 99,
                      border: '1px solid rgba(255,255,255,.55)',
                      bgcolor: 'rgba(53,17,41,.22)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {item}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          <Stack
            justifyContent="center"
            sx={{ minWidth: 0, p: { xs: 3, sm: 5, md: 6 }, bgcolor: '#FFFDFE' }}
          >
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
              <Logo sx={{ width: { xs: 62, md: 76 }, height: { xs: 58, md: 70 } }} />
              <Box>
                <Typography
                  sx={{ color: '#351129', fontSize: 18, fontWeight: 1000, lineHeight: 1 }}
                >
                  LOVEZA{' '}
                  <Box component="span" sx={{ color: '#E5007E' }}>
                    HUNT
                  </Box>
                </Typography>
                <Typography sx={{ mt: 0.45, color: '#897A8C', fontSize: 10, fontWeight: 800 }}>
                  FIND • SHARE • GET FIZZY
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{ mt: 3.5, color: '#E5007E', fontSize: 11, fontWeight: 1000, letterSpacing: 2 }}
            >
              {eyebrow}
            </Typography>
            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                color: '#351129',
                fontSize: { xs: 34, sm: 40, md: 46 },
                lineHeight: 1.08,
                fontWeight: 600,
                letterSpacing: '-.05em',
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ mt: 1.75, color: '#766B78', fontSize: 14, lineHeight: 1.7 }}>
              {description}
            </Typography>

            {/* <Box
              sx={{
                mt: 2.5,
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              }}
            >
              {[
                { icon: 'ri:map-pin-2-fill', label: 'หาร้าน' },
                { icon: 'ri:edit-2-fill', label: 'แจ้งพิกัด' },
                { icon: 'ri:stock-fill', label: 'เช็กของ' },
              ].map((item, index) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 1,
                    minWidth: 0,
                    textAlign: 'center',
                    borderRadius: 2.5,
                    color: '#351129',
                    bgcolor: ['#FFE0F0', '#DDFBF7', '#FFF0B8'][index],
                    border: '2px solid #351129',
                    boxShadow: '2px 2px 0 #351129',
                  }}
                >
                  <Iconify icon={item.icon} width={20} />
                  <Typography sx={{ mt: 0.25, fontSize: 10, fontWeight: 1000 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box> */}

            <Box sx={{ mt: 3 }}>{children}</Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
