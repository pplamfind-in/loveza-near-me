import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { getRewardProgress } from 'src/lib/explorer/rewards';
import { getExplorerRewards } from 'src/lib/explorer/get-explorer-rewards';

import { Iconify } from 'src/components/iconify';

import { RewardCard } from 'src/sections/rewards/reward-card';
import { LimitedRewards } from 'src/sections/rewards/limited-rewards';

export const metadata: Metadata = {
  title: 'รางวัลภารกิจ · การ์ดนักสำรวจ | Loveza Hunt',
  robots: NO_INDEX_ROBOTS,
};
export const dynamic = 'force-dynamic';

export default async function RewardsPage() {
  const db = await createClient();
  const { user, rewards, progress, reports, error, rewardsError } = await getExplorerRewards(db);
  const cards = rewards.map((reward, index) => ({
    reward,
    index,
    status: getRewardProgress(reward, progress, reports),
  }));
  const unlockedCount = cards.filter(({ status }) => status.unlocked).length;
  const remainingCount = rewards.length - unlockedCount;
  const limitedCards = cards.filter(({ reward }) => reward.starts_at && reward.ends_at);
  return (
    <Box
      component="main"
      sx={{
        pt: '100px',
        pb: { xs: 12, md: 8 },
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #FBF0CD80, #FBF6ED 500px)',
      }}
    >
      <Container maxWidth="lg">
        <Button
          href="/account/"
          color="inherit"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ mb: 2 }}
        >
          ภารกิจของฉัน
        </Button>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={{ xs: 4, md: 6 }}
          alignItems={{ md: 'center' }}
          sx={{
            mb: 5,
            py: { xs: 1, md: 2 },
            position: 'relative',
            isolation: 'isolate',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              aspectRatio: '1312 / 1199',
              zIndex: -1,
              background: 'url(/assets/loveza/loveza-coin.webp) center / contain no-repeat',
              pointerEvents: 'none',
            },
            '&::before': {
              width: { xs: '34%', md: '22%' },
              maxWidth: 250,
              top: { xs: 0, md: '3%' },
              right: { xs: 0, md: '15%' },
              opacity: { xs: 0.14, md: 0.23 },
              transform: 'rotate(18deg)',
            },
            '&::after': {
              width: { xs: '22%', md: '12%' },
              maxWidth: 135,
              bottom: { xs: '14%', md: '7%' },
              right: { xs: '4%', md: '38%' },
              opacity: { xs: 0.13, md: 0.2 },
              transform: 'rotate(-23deg)',
            },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                px: 1.25,
                py: 0.75,
                bgcolor: '#FBF0CD',
                color: '#8B631C',
                borderRadius: '8px',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Iconify icon="ri:gift-2-line" width={17} /> สมุดสะสมของนักสำรวจ
            </Box>
            <Typography
              sx={{ fontSize: 11, color: 'primary.dark', fontWeight: 800, letterSpacing: 2 }}
            >
              YOUR QUEST, YOUR COLLECTION
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 30, md: 40 },
                fontWeight: 900,
                mt: 1,
                lineHeight: 1.35,
                letterSpacing: -0.5,
              }}
            >
              รางวัลของนักสำรวจ ✦
            </Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.8 }}>
              ทุกภารกิจพาคุณไปเจอเพื่อนใหม่ ปลดล็อกการ์ดตัวละคร แล้วดาวน์โหลดเก็บเป็นคอลเลกชันของคุณ
            </Typography>
            <Stack
              spacing={1.25}
              alignItems="flex-start"
              sx={{ width: '100%', maxWidth: 430, mt: 3 }}
            >
              <Box
                sx={{
                  width: '100%',
                  p: { xs: 1.75, sm: 2 },
                  background: 'linear-gradient(135deg, #FFFDF8, #EDF4E9)',
                  border: '1px solid #D5E2D1',
                  borderRadius: '18px',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1.25 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '10px',
                        bgcolor: '#DDEBDD',
                        color: 'primary.dark',
                      }}
                    >
                      <Iconify icon="ri:stack-line" width={18} aria-hidden="true" />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>คอลเลกชันของคุณ</Typography>
                  </Stack>
                  <Typography
                    sx={{
                      flexShrink: 0,
                      px: 1,
                      py: 0.5,
                      borderRadius: 99,
                      bgcolor: '#DDEBDD',
                      color: 'primary.darker',
                      fontWeight: 800,
                      fontSize: 13,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {error || rewardsError
                      ? 'โหลดไม่ได้'
                      : `${unlockedCount} / ${rewards.length} ใบ`}
                  </Typography>
                </Stack>
                {!error && !rewardsError && rewards.length > 0 && (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={(unlockedCount / rewards.length) * 100}
                      aria-label="ความคืบหน้าคอลเลกชันรางวัลทั้งหมด"
                      aria-valuetext={`ปลดล็อกแล้ว ${unlockedCount} จาก ${rewards.length} ใบ`}
                      sx={{
                        height: 8,
                        borderRadius: 99,
                        bgcolor: '#D9E4D6',
                        '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: 'primary.main' },
                      }}
                    />
                    <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>
                      {remainingCount
                        ? `เหลืออีก ${remainingCount} ใบให้ปลดล็อก`
                        : 'สะสมครบทุกใบแล้ว!'}
                    </Typography>
                  </>
                )}
              </Box>
              {user && (
                <Button
                  variant="contained"
                  href="/report/"
                  endIcon={<Iconify icon="ri:arrow-right-line" />}
                  sx={{ minHeight: 46, px: 2.5, borderRadius: '10px' }}
                >
                  ออกตามหาการ์ดใบต่อไป
                </Button>
              )}
              {!user && (
                <Button
                  href="/auth/login/?next=%2Frewards%2F"
                  fullWidth
                  sx={{
                    p: 1.5,
                    gap: 1.25,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    color: 'primary.dark',
                    border: '4px solid white',
                    borderRadius: '18px',
                    background: 'linear-gradient(110deg, #FBF0CD, #E8F0E4)',
                    boxShadow: '0 4px 0 #EDE4D7',
                    '&:hover': {
                      background: 'linear-gradient(110deg, #FBEAB4, #DFEBD9)',
                      boxShadow: '0 4px 0 #E0D7C8',
                    },
                    '&:focus-visible': { outline: '3px solid #427653', outlineOffset: 3 },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      bgcolor: '#FFFDFA',
                      borderRadius: '14px',
                      color: '#B77C19',
                    }}
                  >
                    <Iconify icon="ri:gift-2-line" width={24} />
                  </Box>
                  <Box component="span" sx={{ flex: 1 }}>
                    <Typography
                      component="span"
                      sx={{ display: 'block', fontWeight: 800, fontSize: 15 }}
                    >
                      การ์ดน่ารัก ๆ รอคุณอยู่นะ ✦
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        fontSize: 11,
                        fontWeight: 400,
                        color: 'text.secondary',
                        lineHeight: 1.6,
                      }}
                    >
                      เข้าสู่ระบบ เริ่มสะสม แล้วรับการ์ดของคุณเลย
                    </Typography>
                  </Box>
                  <Box
                    component="span"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
                  >
                    <Iconify icon="ri:arrow-right-line" width={24} />
                  </Box>
                </Button>
              )}
            </Stack>
          </Box>
          {limitedCards.length > 0 && (
            <Box
              sx={{
                width: { xs: '100%', md: 310 },
                maxWidth: { xs: 400, md: 'none' },
                alignSelf: { xs: 'center', md: 'flex-start' },
                flexShrink: 0,
                display: 'grid',
                gap: 3,
              }}
            >
              <LimitedRewards cards={limitedCards} />
            </Box>
          )}
        </Stack>
        {rewardsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            โหลดรายการรางวัลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </Alert>
        )}
        {!rewardsError && rewards.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            กำลังเตรียมรางวัลใหม่ พบกันเร็ว ๆ นี้
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            โหลดข้อมูลภารกิจไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </Alert>
        )}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2.5, px: 0.5 }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 10, letterSpacing: 2, fontWeight: 800, color: 'primary.dark' }}
            >
              THE COLLECTION
            </Typography>
            <Typography component="h2" sx={{ fontSize: 22, fontWeight: 800, mt: 0.5 }}>
              เพื่อนนักสำรวจที่รอคุณอยู่
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${rewards.length - limitedCards.length} การ์ด`}
            sx={{ bgcolor: '#E8F0E4', color: 'primary.dark', fontWeight: 800 }}
          />
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {cards
            .filter(({ reward }) => !reward.starts_at || !reward.ends_at)
            .map((card) => (
              <RewardCard key={card.reward.id} {...card} />
            ))}
        </Box>
        <Typography sx={{ mt: 3, color: 'text.secondary', fontSize: 12, lineHeight: 1.8 }}>
          นับจากประวัติที่ผ่านอนุมัติของคุณ รวมประวัติเดิม ร้านซ้ำไม่เพิ่มความคืบหน้า
          รางวัลเป็นการ์ดดิจิทัลสำหรับดาวน์โหลด ไม่มีเหรียญโบนัสหรือของรางวัลจัดส่ง
        </Typography>
        <Button
          href={user ? '/report/' : '/auth/login/?next=%2Freport%2F'}
          variant="contained"
          startIcon={<Iconify icon="ri:map-pin-add-line" />}
          sx={{ mt: 2, minHeight: 48 }}
        >
          ออกทำภารกิจ
        </Button>
        <Box
          component="aside"
          aria-label="หมายเหตุเกี่ยวกับตัวละคร"
          sx={{ mt: 4, pt: 2.5, borderTop: '1px solid #E5DECF' }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.75, color: 'primary.dark' }}
          >
            <Iconify icon="ri:heart-line" width={18} />
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
              สร้างขึ้นเพื่อความสนุกของทุกคน
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, lineHeight: 1.9, color: 'text.secondary' }}>
            ขออภัยเจ้าของผลงานและผู้เกี่ยวข้องที่นำตัวละครมาประกอบเว็บไซต์นี้
            เว็บไซต์จัดทำขึ้นเพื่อให้ทุกคนได้ร่วมสนุกและแบ่งปันประสบการณ์ไปด้วยกัน
            โดยไม่ได้มุ่งหวังกำไรหรือผลประโยชน์จากเว็บไซต์
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
