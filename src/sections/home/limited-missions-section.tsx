import type { createClient } from 'src/lib/supabase/server';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { getRewardProgress } from 'src/lib/explorer/rewards';
import { getExplorerRewards } from 'src/lib/explorer/get-explorer-rewards';

import { Iconify } from 'src/components/iconify';

import { RewardCard } from 'src/sections/rewards/reward-card';

import { landingCardRadius } from './explorer-styles';

export async function LimitedMissionsSection({
  db,
}: {
  db: Awaited<ReturnType<typeof createClient>>;
}) {
  const { rewards, progress, reports } = await getExplorerRewards(db);
  const cards = rewards.flatMap((reward, index) =>
    reward.starts_at && reward.ends_at
      ? [{ reward, index, status: getRewardProgress(reward, progress, reports) }]
      : []
  );

  const featured =
    cards.find(({ status }) => status.schedule.state === 'active' && !status.unlocked) ??
    cards.find(({ status }) => status.schedule.state === 'active') ??
    cards.find(({ status }) => status.schedule.state === 'upcoming') ??
    cards[0];

  if (!featured) return null;

  const { reward, status } = featured;
  const canStart = status.schedule.state === 'active' && !status.unlocked;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        component="section"
        aria-labelledby="limited-missions-title"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 145px) minmax(0, 1fr) minmax(0, 280px)',
            lg: 'minmax(0, 210px) minmax(0, 1fr) minmax(0, 360px)',
          },
          gridTemplateAreas: { xs: '"card" "details"', md: '"artwork details card"' },
          alignItems: 'center',
          gap: { xs: 3, md: 3, lg: 4 },
          p: { xs: 2.5, sm: 4, md: 5 },
          border: '5px solid #D8AB42',
          borderRadius: landingCardRadius,
          background: 'linear-gradient(125deg, #FFF8E9 20%, #FFE9AD 100%)',
        }}
      >
        <Box
          sx={{
            gridArea: { xs: 'card', md: 'artwork' },
            position: 'relative',
            zIndex: 2,
            justifySelf: 'end',
            alignSelf: { xs: 'end', md: 'center' },
            width: { xs: 'clamp(120px, 40%, 168px)', md: 'calc(100% + 64px)' },
            transform: { xs: 'translateY(12px)', md: 'none' },
            pointerEvents: 'none',
          }}
        >
          <Image
            src="/assets/illustrations/p-card-heart-hands.webp"
            alt=""
            width={1295}
            height={1214}
            unoptimized
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </Box>
        <Box sx={{ gridArea: 'details' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#805613' }}>
            <Iconify icon="ri:time-line" width={18} />
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
              ภารกิจพิเศษ · มีเวลาจำกัด
            </Typography>
          </Stack>
          <Typography
            id="limited-missions-title"
            component="h2"
            sx={{ mt: 1.5, fontSize: { xs: 32, sm: 40, lg: 48 }, lineHeight: 1.2, fontWeight: 900 }}
          >
            {reward.name}
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: { xs: 15, sm: 17 }, color: 'text.secondary' }}>
            ทำภารกิจให้ครบเพื่อปลดล็อกการ์ดตัวละครลิมิเต็ด แล้วดาวน์โหลดเก็บเข้าคอลเลกชันของคุณ
          </Typography>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="flex-start"
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: '14px',
              border: '1px solid #E8D3A1',
              bgcolor: '#FAEDCA',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '9px',
                bgcolor: '#F3DFA7',
                color: '#73501C',
              }}
            >
              <Iconify icon="ri:map-pin-add-line" width={18} aria-hidden="true" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#73501C' }}>
                วิธีทำภารกิจ
              </Typography>
              <Typography sx={{ mt: 0.25, fontSize: 14, fontWeight: 800 }}>
                {status.condition}
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
                นับเฉพาะรายงานที่ผ่านอนุมัติ
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ mt: 2, color: '#805613', fontSize: 13, fontWeight: 800 }}>
            {status.schedule.label}
            {status.schedule.state !== 'ended' && ' · เวลาไทย'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: canStart ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
              },
              width: { sm: 'fit-content' },
              maxWidth: '100%',
              gap: 1.25,
              mt: 2,
              '& .MuiButton-root.MuiButton-root': {
                minWidth: 0,
                minHeight: 48,
                px: 1.5,
                boxShadow: 'none',
                '&:hover, &:active': { boxShadow: 'none' },
              },
            }}
          >
            {canStart && (
              <Button
                href="/report/"
                variant="contained"
                disableElevation
                endIcon={<Iconify icon="ri:arrow-right-line" />}
              >
                แจ้งพิกัดเพื่อทำภารกิจ
              </Button>
            )}
            <Button href="/rewards/" variant="outlined" sx={{ bgcolor: '#FFFDFA' }}>
              ดูรางวัลทั้งหมด
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            gridArea: 'card',
            position: 'relative',
            minWidth: 0,
            py: { xs: 2, sm: 3 },
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              aspectRatio: '1312 / 1199',
              background: 'url(/assets/loveza/loveza-coin.webp) center / contain no-repeat',
              pointerEvents: 'none',
            },
            '&::before': {
              width: { xs: '38%', md: '46%' },
              top: '2%',
              right: { xs: '-5%', md: '-8%' },
              opacity: 0.34,
              transform: 'rotate(18deg)',
            },
            '&::after': {
              width: '32%',
              bottom: '6%',
              left: { xs: '-5%', md: '-8%' },
              opacity: 0.29,
              transform: 'rotate(-23deg)',
            },
          }}
        >
          <Box sx={{ width: 'min(100% - 40px, 310px)', position: 'relative', zIndex: 1 }}>
            <RewardCard {...featured} showDetails={false} />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
