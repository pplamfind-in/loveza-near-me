import type { Metadata } from 'next';
import type { ExplorerReward } from 'src/lib/explorer/rewards';

import Image from 'next/image';
import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { buildExplorerProgress } from 'src/lib/explorer/progress';
import {
  getRewardProgress,
  REWARD_CARD_HEADER,
  sortRewardsForDisplay,
} from 'src/lib/explorer/rewards';

import { Iconify } from 'src/components/iconify';

import { RewardNavigation } from 'src/sections/rewards/reward-navigation';
import { ProtectedArtwork } from 'src/sections/rewards/protected-artwork';
import { RewardDownloadButton } from 'src/sections/rewards/download-button';

export const metadata: Metadata = { title: 'การ์ดนักสำรวจ | Loveza Hunt', robots: NO_INDEX_ROBOTS };
export const dynamic = 'force-dynamic';

const countingDetails = {
  uniqueStores: 'ระบบนับจากรายงานพิกัดที่ผ่านอนุมัติ โดยแต่ละร้านนับเพียงครั้งเดียว',
  provinces: 'นับเฉพาะพิกัดที่ผ่านอนุมัติ จังหวัดละหนึ่งครั้ง',
  approvedReports: 'ระบบนับรายงานพิกัดแต่ละรายการที่ผ่านอนุมัติ',
  explorationDays: 'ระบบนับวันที่ส่งรายงานพิกัดที่ผ่านอนุมัติ โดยนับวันละหนึ่งครั้งตามเวลาไทย',
};

export default async function RewardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [
    { data: rows, error: catalogError },
    {
      data: { user },
    },
  ] = await Promise.all([
    db
      .from('explorer_rewards')
      .select('*, rule:explorer_reward_rules(*)')
      .eq('is_active', true)
      .order('sort_order')
      .order('id'),
    db.auth.getUser(),
  ]);
  if (catalogError) throw new Error('โหลดรายการรางวัลไม่สำเร็จ');
  const rewards = sortRewardsForDisplay((rows ?? []) as ExplorerReward[]);
  const reward = rewards.find((item) => item.id === id);
  if (!reward) notFound();
  const { data: reports, error } = user
    ? await db
        .from('reports')
        .select('store_id, approval_status, province, created_at, flavors, stock_status')
        .eq('reporter_id', user.id)
    : { data: null, error: null };
  const status = getRewardProgress(
    reward,
    user && !error ? buildExplorerProgress(reports ?? []) : null,
    reports ?? []
  );
  const source = reward.rule?.source ?? reward.metric;
  const countingDetail =
    source in countingDetails ? countingDetails[source as keyof typeof countingDetails] : null;
  const mobileCardReserve = status.schedule.state === 'always' ? 376 : 450;
  const progressPercent = (status.current / status.target) * 100;

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(var(--layout-header-mobile-height) + 8px)', md: '100px' },
        pb: { xs: 'max(12px, env(safe-area-inset-bottom, 0px))', md: 8 },
        '--reward-card-max-width': {
          xs: `clamp(156px, calc((100dvh - ${mobileCardReserve}px) * 0.75), 440px)`,
          md: '440px',
        },
        minHeight: '100dvh',
        overflowX: 'clip',
        background: status.unlocked
          ? `radial-gradient(ellipse at 20% 20%, ${reward.color}, #FBF6ED 75%)`
          : 'linear-gradient(180deg, #F1F2F3, #FBF6ED 80%)',
      }}
    >
      <Container maxWidth="lg">
        <Button
          href="/rewards/"
          color="inherit"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ mb: { xs: 0.75, md: 3 } }}
        >
          ย้อนกลับ
        </Button>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
            gap: { xs: 1, md: 7 },
            alignItems: 'center',
          }}
        >
          <RewardNavigation
            key={id}
            rewards={rewards.map((item) => ({ id: item.id, name: item.name }))}
            id={id}
            back={
              <Stack spacing={1} alignItems="center" sx={{ width: '100%', maxWidth: 224 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.375,
                    borderRadius: 99,
                    bgcolor: '#DCEDE0',
                    color: '#28583A',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <Iconify
                    icon={status.unlocked ? 'ri:trophy-line' : 'ri:lock-2-line'}
                    width={14}
                    aria-hidden="true"
                  />
                  {status.unlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}
                </Box>
                <Typography
                  sx={{
                    color: '#21452F',
                    fontWeight: 900,
                    fontSize: 'clamp(16px, 8cqw, 28px)',
                    lineHeight: 1.2,
                    textWrap: 'balance',
                  }}
                >
                  {reward.name}
                </Typography>
                <Typography sx={{ color: '#526455', fontSize: 12, lineHeight: 1.5 }}>
                  {status.condition}
                </Typography>
                <Box sx={{ width: '100%', pt: 0.5 }}>
                  <Typography sx={{ color: '#28583A', fontSize: 14, fontWeight: 900, mb: 0.5 }}>
                    {status.current} / {status.target} {status.unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    aria-label="ความคืบหน้าภารกิจ"
                    sx={{
                      height: 5,
                      borderRadius: 99,
                      bgcolor: '#D6E1D2',
                      '& .MuiLinearProgress-bar': { bgcolor: '#427653', borderRadius: 99 },
                    }}
                  />
                </Box>
              </Stack>
            }
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 'var(--reward-card-max-width)',
                mx: 'auto',
                aspectRatio: '3 / 4',
                containerType: 'inline-size',
                border:
                  status.schedule.state !== 'always' ? '6px solid #FFF6D8' : '6px solid white',
                outline: status.schedule.state !== 'always' ? '2px solid #D8AB42' : 'none',
                outlineOffset: 2,
                borderRadius: '22px',
                overflow: 'hidden',
                background: status.unlocked
                  ? `radial-gradient(circle at 20% 22%, #fff 0 3px, transparent 4px),
                     radial-gradient(circle at 80% 52%, #FFE08B 0 4px, transparent 5px),
                     radial-gradient(circle at 50% 44%, #fff 0%, transparent 55%),
                     linear-gradient(150deg, #FFFFFFBB, ${reward.color})`
                  : 'linear-gradient(150deg, #F1F2F3, #DDE0E3)',
                boxShadow: '0 5px 0 #EDE4D7',
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  top: '5cqw',
                  insetInline: '5cqw',
                  zIndex: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 1,
                  color: REWARD_CARD_HEADER.color,
                  fontSize: '2.5cqw',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{REWARD_CARD_HEADER.brand}</span>
                <span>{REWARD_CARD_HEADER.label}</span>
              </Box>
              {status.schedule.state !== 'always' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '10cqw',
                    left: '5cqw',
                    zIndex: 3,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '8px',
                    border: '1px solid #D4A340',
                    background: 'linear-gradient(110deg, #FFE7A0, #FFF6D8, #F1C558)',
                    color: '#684515',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  ✦ LIMITED · การ์ดพิเศษ
                </Box>
              )}
              <ProtectedArtwork>
                <Image
                  src={
                    status.unlocked
                      ? `/assets/illustrations/${reward.character}`
                      : '/assets/icons/loveza/icon-question-mark.webp'
                  }
                  alt={status.unlocked ? reward.name : 'การ์ดลับ รอคุณมาปลดล็อก'}
                  fill
                  unoptimized
                  sizes="(max-width: 899px) 90vw, 440px"
                  style={{
                    objectFit: 'contain',
                    objectPosition: status.unlocked ? 'center bottom' : 'center',
                    padding: status.unlocked ? '12px 12px 0' : '25%',
                  }}
                />
              </ProtectedArtwork>
            </Box>
          </RewardNavigation>
          <Stack
            spacing={{ xs: 1, md: 2 }}
            sx={{
              minWidth: 0,
              alignItems: { xs: 'center', md: 'stretch' },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 27, md: 44 },
                  lineHeight: 1.16,
                  fontWeight: 900,
                  color: 'primary.darker',
                  overflowWrap: 'anywhere',
                  textWrap: 'balance',
                  '&::after': {
                    content: '""',
                    display: 'block',
                    width: 40,
                    height: { xs: 3, md: 4 },
                    mt: { xs: 0.75, md: 1.25 },
                    mx: { xs: 'auto', md: 0 },
                    borderRadius: 99,
                    bgcolor: 'primary.main',
                  },
                }}
              >
                {reward.name}
              </Typography>
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
                  mt: 1.75,
                  color: 'text.secondary',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {status.condition}
              </Typography>
            </Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignSelf: 'flex-start',
                px: 1,
                py: 0.5,
                border: '1px solid currentColor',
                borderRadius: '8px',
                color: 'primary.dark',
              }}
            >
              <Iconify
                aria-hidden="true"
                icon={status.unlocked ? 'ri:trophy-line' : 'ri:lock-2-line'}
                width={16}
              />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {status.unlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}
              </Typography>
            </Stack>
            {countingDetail && (
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
                  maxWidth: '46ch',
                  color: 'text.secondary',
                  lineHeight: 1.75,
                }}
              >
                {countingDetail}
                {!status.unlocked && (
                  <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                    ครบเป้าหมายแล้วดาวน์โหลดการ์ด PNG ได้
                  </Box>
                )}
              </Typography>
            )}
            {status.schedule.state !== 'always' && (
              <Stack
                direction="row"
                alignItems="flex-start"
                spacing={1.25}
                sx={{
                  width: '100%',
                  maxWidth: 420,
                  p: 1.5,
                  border: '1px solid #E8D6AD',
                  borderRadius: '14px',
                  bgcolor: '#FFF7E2',
                  color: '#63461B',
                  textAlign: 'left',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: '9px',
                    bgcolor: '#F6E5B8',
                  }}
                >
                  <Iconify icon="ri:time-line" width={18} aria-hidden="true" />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                    {status.schedule.label}
                    {status.schedule.state !== 'ended' && ' · เวลาไทย'}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 12, lineHeight: 1.65 }}>
                    การ์ดพิเศษนี้นับเฉพาะภารกิจในช่วงกิจกรรม
                  </Typography>
                </Box>
              </Stack>
            )}
            {error && <Alert severity="error">โหลดความคืบหน้าไม่สำเร็จ กรุณาลองใหม่</Alert>}
            <Stack
              spacing={{ xs: 1, md: 1.5 }}
              sx={{
                width: '100%',
                '& .MuiButton-root': {
                  alignSelf: { xs: 'center', md: 'flex-start' },
                  width: 'auto',
                  minHeight: 42,
                },
              }}
            >
              <Box sx={{ display: { xs: 'none', md: 'block' }, width: '100%', maxWidth: 320 }}>
                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <Typography component="h2" variant="body2" sx={{ fontWeight: 800 }}>
                    ความคืบหน้าภารกิจ
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {status.current} / {status.target} {status.unit}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  aria-label="ความคืบหน้าภารกิจ"
                  sx={{
                    height: 6,
                    borderRadius: 99,
                    bgcolor: '#ECE9DC',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      bgcolor: 'primary.main',
                    },
                  }}
                />
              </Box>
              {status.unlocked ? (
                <RewardDownloadButton key={reward.id} id={reward.id} shareEnabled />
              ) : (
                <Button
                  variant="contained"
                  disabled={
                    status.schedule.state === 'upcoming' || status.schedule.state === 'ended'
                  }
                  href={
                    user ? '/report/' : `/auth/login/?next=${encodeURIComponent(`/rewards/${id}/`)}`
                  }
                  startIcon={<Iconify icon="ri:map-pin-add-line" />}
                  sx={{ borderRadius: '10px' }}
                >
                  {status.schedule.state === 'upcoming'
                    ? 'รอเปิดกิจกรรม'
                    : status.schedule.state === 'ended'
                      ? 'สิ้นสุดกิจกรรมแล้ว'
                      : user
                        ? 'ออกทำภารกิจ ปลดล็อกการ์ด'
                        : 'เข้าสู่ระบบเพื่อสะสมการ์ด'}
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
