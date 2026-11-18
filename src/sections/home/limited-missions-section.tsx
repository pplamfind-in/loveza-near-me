import type { createClient } from 'src/lib/supabase/server';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { getRewardProgress } from 'src/lib/explorer/rewards';
import { getExplorerRewards } from 'src/lib/explorer/get-explorer-rewards';

import { Iconify } from 'src/components/iconify';

import { RewardCard } from 'src/sections/rewards/reward-card';

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
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 410px)' },
          gridTemplateAreas: { xs: '"card" "details"', md: '"details card"' },
          alignItems: 'center',
          gap: { xs: 4, md: 5 },
          p: { xs: 2.5, sm: 4, md: 5 },
          border: '1px solid #E6CE96',
          borderRadius: '28px',
          background: 'linear-gradient(125deg, #FFF8E9 20%, #FFE9AD 100%)',
        }}
      >
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
          <Box
            sx={{
              mt: 2.5,
              p: { xs: 1.5, sm: 2 },
              borderRadius: '16px',
              border: '1px solid #EAD8AE',
              bgcolor: '#FFFDFA',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Iconify icon="ri:map-pin-add-line" width={22} sx={{ color: 'primary.dark' }} />
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800 }}>ต้องทำอะไร</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 14 }}>{status.condition}</Typography>
                <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary' }}>
                  ระบบนับความคืบหน้าจากรายงานที่ผ่านการอนุมัติ
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Typography sx={{ mt: 2, color: '#805613', fontSize: 13, fontWeight: 800 }}>
            {status.schedule.label}
            {status.schedule.state !== 'ended' && ' · เวลาไทย'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
            {canStart && (
              <Button
                href="/report/"
                variant="contained"
                endIcon={<Iconify icon="ri:arrow-right-line" />}
                sx={{ minHeight: 48, px: 2.5 }}
              >
                แจ้งพิกัดเพื่อทำภารกิจ
              </Button>
            )}
            <Button href="/rewards/" variant="outlined" sx={{ minHeight: 48, bgcolor: '#FFFDFA' }}>
              ดูรางวัลทั้งหมด
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            gridArea: 'card',
            position: 'relative',
            minWidth: 0,
            py: { xs: 2, sm: 3 },
            background:
              'repeating-radial-gradient(circle at center, transparent 0 31px, #A9752224 32px 33px, transparent 34px 55px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at center, #FFF9DF 12%, transparent 68%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ width: 'min(100% - 12px, 310px)', position: 'relative' }}>
            <RewardCard {...featured} showDetails={false} />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
