'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { explorerLabelSx } from 'src/sections/home/explorer-styles';

const missions = [
  {
    image: 'voxel-store.svg',
    title: 'เจอร้านง่ายขึ้น',
    body: 'ค้นหาร้านใกล้ตัว ดูระยะทางและข้อมูลสินค้าที่ชุมชนช่วยกันแจ้ง',
  },
  {
    image: 'voxel-map-pin.svg',
    title: 'ทุกพิกัดมีความหมาย',
    body: 'ร้านเล็ก ๆ ที่คุณพบ อาจเป็นพิกัดที่ใครอีกคนกำลังตามหาอยู่',
  },
  {
    image: 'voxel-soda.svg',
    title: 'ช่วยกันดูแลข้อมูล',
    body: 'บอกจำนวนที่พบและเวลาอัปเดต ให้คนต่อไปมีข้อมูลประกอบการเดินทาง',
  },
];

const steps = [
  {
    icon: 'ri:compass-3-line',
    title: 'ออกไปค้นพบ',
    body: 'เริ่มจากร้านใกล้บ้านหรือร้านระหว่างทางที่คุณแวะไป',
  },
  {
    icon: 'ri:map-pin-add-line',
    title: 'ปักหมุดบอกต่อ',
    body: 'เข้าสู่ระบบ แจ้งพิกัดร้าน รสชาติ และจำนวนสินค้าที่พบ',
  },
  {
    icon: 'ri:community-line',
    title: 'ต่อเติมแผนที่',
    body: 'ข้อมูลของคุณช่วยให้คนอื่นค้นหาร้าน และชวนชุมชนออกไปสำรวจต่อ',
  },
];

const cardSx = {
  border: '5px solid var(--palette-background-paper)',
  borderRadius: '18px',
  bgcolor: 'background.paper',
  boxShadow: '0 4px 0 var(--palette-grey-200)',
};

export function AboutView() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
      <Box
        component="section"
        sx={{ position: 'relative', overflow: 'hidden', minHeight: { md: 570 } }}
      >
        <Box
          component="img"
          src="/assets/loveza/login-welcome-v1.webp"
          alt=""
          width={1536}
          height={1024}
          fetchPriority="high"
          sx={{
            position: 'absolute',
            inset: 0,
            width: 1,
            height: 1,
            objectFit: 'cover',
            objectPosition: 'right center',
            maskImage: 'linear-gradient(to bottom, black 75%, transparent)',
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, var(--palette-background-default), rgba(251,246,237,.95) 50%, transparent)',
              md: 'linear-gradient(90deg, var(--palette-background-default), rgba(251,246,237,.9) 35%, transparent 85%)',
            },
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box
            sx={{
              maxWidth: 540,
              pt: {
                xs: 'calc(var(--layout-header-mobile-height) + 32px)',
                md: 'calc(var(--layout-header-desktop-height) + 56px)',
              },
              pb: { xs: 24, md: 12 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main' }}>
              <Iconify icon="ri:heart-2-line" width={20} />
              <Typography sx={explorerLabelSx}>A LITTLE HUNT. A SHARED WORLD.</Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontSize: { xs: 38, md: 54 },
                lineHeight: 1.35,
                fontWeight: 900,
                letterSpacing: '-.03em',
              }}
            >
              เพราะความซ่า
              <br />
              <Box component="span" sx={{ color: 'primary.main' }}>
                ไม่ควรหายาก
              </Box>
            </Typography>
            <Typography
              sx={{ mt: 2, maxWidth: 420, fontSize: 16, color: 'text.secondary', lineHeight: 1.9 }}
            >
              Loveza Hunt คือแผนที่จากการค้นพบของทุกคน ชวนกันปักหมุดร้านและส่งต่อพิกัด ให้การตามหา
              Loveza ครั้งต่อไปง่ายขึ้น
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                href="/nearby"
                variant="contained"
                startIcon={<Iconify icon="ri:compass-3-line" />}
                sx={{ px: 3, py: 1.4 }}
              >
                เริ่มสำรวจใกล้ฉัน
              </Button>
              <Button href="/mapza" endIcon={<Iconify icon="ri:arrow-right-line" />}>
                ดูแผนที่ของชุมชน
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ position: 'relative', mt: { xs: -4, md: -3 } }}>
        <Box
          component="section"
          aria-label="สิ่งที่เราอยากให้เกิดขึ้น"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
            mb: { xs: 5, md: 7 },
          }}
        >
          {missions.map((mission) => (
            <Box key={mission.title} sx={{ ...cardSx, p: 2.5 }}>
              <Box
                component="img"
                src={`/assets/icons/loveza/${mission.image}`}
                alt=""
                width={52}
                height={52}
                sx={{ display: 'block' }}
              />
              <Typography component="h2" sx={{ mt: 2, fontSize: 20, fontWeight: 800 }}>
                {mission.title}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary', lineHeight: 1.9 }}>
                {mission.body}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box
          component="section"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 3, md: 6 },
            alignItems: 'center',
            mb: { xs: 5, md: 7 },
          }}
        >
          <Box
            component="img"
            src="/assets/loveza/voxel-loveza-trees-v2.webp"
            alt="นักสำรวจและร้าน Loveza ในโลกบล็อก"
            width={1536}
            height={1024}
            loading="lazy"
            sx={{
              ...cardSx,
              display: 'block',
              width: 1,
              height: { xs: 250, md: 330 },
              objectFit: 'cover',
              objectPosition: 'right center',
            }}
          />
          <Box>
            <Typography sx={explorerLabelSx}>BUILT ONE PIN AT A TIME</Typography>
            <Typography
              component="h2"
              sx={{ mt: 1.5, fontSize: { xs: 28, md: 36 }, lineHeight: 1.45, fontWeight: 800 }}
            >
              พิกัดเล็ก ๆ ของคุณ
              <br />
              เติมเต็มแผนที่ของเรา
            </Typography>
            <Typography sx={{ mt: 2, fontSize: 14, color: 'text.secondary', lineHeight: 1.9 }}>
              เราเริ่มจากคำถามง่าย ๆ ว่า “Loveza หาซื้อที่ไหน?”
              เลยอยากสร้างพื้นที่ให้คนที่พบร้านแล้ว มาช่วยบอกทางคนที่ยังตามหาอยู่
              ตั้งแต่ร้านใกล้บ้าน ไปจนถึงจังหวัดที่ยังไม่มีใครปักหมุด
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: 14, color: 'text.secondary', lineHeight: 1.9 }}>
              ข้อมูลสินค้าเป็นสิ่งที่ชุมชนพบในแต่ละช่วงเวลา อาจเปลี่ยนแปลงได้
              ทีมดูแลสามารถตรวจสอบและปรับปรุงข้อมูล เพื่อให้ทุกคนใช้งานได้ดีขึ้น
            </Typography>
          </Box>
        </Box>
        <Box component="section" sx={{ mb: { xs: 5, md: 7 } }}>
          <Typography sx={explorerLabelSx}>YOUR NEXT LITTLE QUEST</Typography>
          <Typography component="h2" sx={{ mt: 1, fontSize: { xs: 28, md: 34 }, fontWeight: 800 }}>
            เจอ → แจ้ง → ส่งต่อความซ่า
          </Typography>
          <Box
            component="ol"
            sx={{
              p: 0,
              m: 0,
              mt: 3,
              listStyle: 'none',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {steps.map((step, index) => (
              <Box component="li" key={step.title} sx={{ ...cardSx, p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box
                    sx={{
                      p: 1,
                      display: 'flex',
                      bgcolor: 'primary.lighter',
                      color: 'primary.main',
                      borderRadius: '10px',
                    }}
                  >
                    <Iconify icon={step.icon} width={24} />
                  </Box>
                  <Typography
                    sx={{ color: 'primary.main', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}
                  >
                    QUEST / 0{index + 1}
                  </Typography>
                </Stack>
                <Typography component="h3" sx={{ mt: 2, fontSize: 19, fontWeight: 800 }}>
                  {step.title}
                </Typography>
                <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 13, lineHeight: 1.9 }}>
                  {step.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Stack
          component="section"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: { xs: 3, md: 4 }, mb: 5, borderRadius: '18px', bgcolor: 'primary.lighter' }}
        >
          <Box>
            <Typography component="h2" sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800 }}>
              มาเติมพิกัดถัดไปด้วยกัน
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary', lineHeight: 1.8 }}>
              ไม่ต้องสำรวจไกล แค่ร้านที่คุณพบระหว่างทางก็มีค่า
            </Typography>
          </Box>
          <Button
            href="/report"
            variant="contained"
            startIcon={<Iconify icon="ri:map-pin-add-line" />}
            sx={{ flexShrink: 0, px: 3, minHeight: 44 }}
          >
            ช่วยแจ้งพิกัด
          </Button>
        </Stack>
        <Stack
          component="section"
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ pt: 3, borderTop: '1px solid var(--palette-grey-300)' }}
        >
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              bgcolor: 'background.paper',
              color: 'primary.main',
              borderRadius: '12px',
            }}
          >
            <Iconify icon="ri:code-s-slash-line" width={26} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 800, letterSpacing: 2 }}
            >
              DEVELOPED BY
            </Typography>
            <Typography
              component="h2"
              sx={{ mt: 0.5, fontSize: { xs: 18, md: 22 }, fontWeight: 800 }}
            >
              Kittitorn Sermthaisong
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
