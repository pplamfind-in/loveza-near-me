import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { POINTS_PER_STORE } from 'src/lib/explorer/progress';

import { Iconify } from 'src/components/iconify';

import { explorerCardSx, explorerLabelSx } from 'src/sections/home/explorer-styles';

const leaderboardPath = '/mapza/leaderboard/';

type LeaderboardEntry = {
  placement: number;
  display_name: string;
  avatar_url: string | null;
  store_count: number;
  province_count: number;
};

export const metadata: Metadata = createSeoMetadata({
  title: 'อันดับนักสำรวจ | Loveza Hunt',
  description: 'ดูอันดับนักสำรวจ Loveza จากร้านไม่ซ้ำที่แจ้งและผ่านอนุมัติ',
  path: leaderboardPath,
});

const podiumColors = ['#F7E5A9', '#E4EBEA', '#F0D9C3'];
const periodTabSx = {
  minHeight: 40,
  minWidth: { xs: 0, sm: 90 },
  flex: { xs: 1, sm: 'initial' },
  px: 1.75,
  color: '#2C5840',
  fontWeight: 800,
  '&&[aria-current="page"]': {
    bgcolor: '#346649',
    color: '#FFFDF5',
  },
};
const podiumSteps = [
  { placement: 1, column: 2, color: '#F4C34F', base: '#F9E5A3', ink: '#633C10', height: 112 },
  { placement: 2, column: 1, color: '#B9CCEC', base: '#E1EAF7', ink: '#304A73', height: 88 },
  { placement: 3, column: 3, color: '#F4B591', base: '#F9E0D1', ink: '#70432C', height: 72 },
];

function ExplorerPodium({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Box
      aria-label="โพเดียมสามอันดับแรก"
      component="section"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        alignItems: 'end',
        gap: { xs: 0.5, sm: 1.25 },
        maxWidth: 610,
        mx: 'auto',
        mb: { xs: 2, sm: 3 },
        px: { xs: 0.75, sm: 2 },
        borderRadius: '22px',
        background: 'radial-gradient(ellipse 50% 50% at center, #FFF4C8B3, transparent)',
      }}
    >
      {podiumSteps.map(({ placement, column, color, base, ink, height }) => {
        const winners = entries.filter((entry) => entry.placement === placement);
        return (
          <Box
            key={placement}
            role={winners.length ? 'group' : undefined}
            aria-label={winners.length ? `อันดับ ${placement}` : undefined}
            aria-hidden={!winners.length}
            sx={{ gridColumn: column, gridRow: 1, minWidth: 0, textAlign: 'center' }}
          >
            <Stack component="ul" spacing={0.75} sx={{ p: 0, m: 0, mb: 1, listStyle: 'none' }}>
              {winners.map((winner, index) => (
                <Box component="li" key={index} sx={{ px: { xs: 0.25, sm: 1 } }}>
                  <Avatar
                    src={winner.avatar_url || undefined}
                    alt=""
                    slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                    sx={{
                      mx: 'auto',
                      mb: 0.5,
                      width: { xs: 40, sm: 54 },
                      height: { xs: 40, sm: 54 },
                      border: '3px solid #FFFDF1',
                      outline: `2px solid ${color}`,
                      bgcolor: color,
                      color: ink,
                    }}
                  >
                    {winner.display_name.charAt(0)}
                  </Avatar>
                  <Typography
                    sx={{ fontSize: { xs: 12, sm: 15 }, fontWeight: 800, overflowWrap: 'anywhere' }}
                  >
                    {winner.display_name}
                  </Typography>
                  <Typography
                    sx={{
                      display: 'inline-block',
                      mt: 0.25,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: '8px',
                      bgcolor: base,
                      color: ink,
                      fontSize: { xs: 11, sm: 13 },
                      fontWeight: 800,
                    }}
                  >
                    {(winner.store_count * POINTS_PER_STORE).toLocaleString('th-TH')} เหรียญ
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Box
              aria-hidden="true"
              sx={{
                display: 'grid',
                placeContent: 'center',
                height: { xs: height - 14, sm: height },
                borderRadius: '18px 18px 3px 3px',
                borderTop: '3px solid #FFFDF1',
                background: winners.length
                  ? `linear-gradient(180deg, ${color} 0%, ${base} 62%, transparent 100%)`
                  : 'linear-gradient(180deg, #EDE7D9, transparent)',
                color: ink,
              }}
            >
              {winners.length > 0 && (
                <Stack alignItems="center" spacing={0.25}>
                  <Iconify icon={placement === 1 ? 'ri:trophy-fill' : 'ri:medal-fill'} width={16} />
                  <Typography sx={{ fontSize: { xs: 28, sm: 40 }, fontWeight: 900, lineHeight: 1 }}>
                    {placement}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const monthly = (await searchParams).period === 'monthly';
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_public_explorer_leaderboard', { monthly });
  const entries = (data ?? []) as LeaderboardEntry[];
  const showPodium = !monthly && !error && entries.length > 0;
  const listEntries = monthly ? entries : entries.filter(({ placement }) => placement >= 4);
  const periodLabel = monthly
    ? new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    : null;

  return (
    <Box sx={{ minHeight: '100vh', pb: 6, bgcolor: 'background.default' }}>
      <Box
        component="section"
        aria-labelledby="leaderboard-title"
        sx={{ position: 'relative', overflow: 'hidden' }}
      >
        <Box
          component="img"
          src="/assets/loveza/voxel-explorer-v1.webp"
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
            objectPosition: { xs: '70% 65%', md: 'right 55%' },
            maskImage: monthly
              ? 'linear-gradient(to bottom, black 73%, transparent 100%)'
              : 'linear-gradient(to bottom, black 66%, #000B 80%, transparent 100%)',
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, var(--palette-background-default) 6%, #FBF6EDF2 43%, transparent 78%)',
              md: 'linear-gradient(90deg, #FBF6ED 5%, #FBF6EDDA 32%, transparent 72%)',
            },
          }}
        />
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            pt: {
              xs: 'calc(var(--layout-header-mobile-height) + 24px)',
              md: 'calc(var(--layout-header-desktop-height) + 44px)',
            },
            pb: monthly ? { xs: 22, sm: 26, md: 15 } : { xs: 24, sm: 25, md: 22 },
          }}
        >
          <Button
            href="/mapza/#nationwide-map"
            startIcon={<Iconify icon="ri:arrow-left-line" />}
            sx={{ minHeight: 40, mb: 1.5 }}
          >
            กลับไปที่แผนที่
          </Button>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'primary.dark' }}>
            <Iconify icon="ri:trophy-line" width={20} />
            <Typography sx={explorerLabelSx}>LOVEZA LEADERBOARD</Typography>
          </Stack>
          <Typography
            id="leaderboard-title"
            component="h1"
            sx={{
              mt: 1,
              fontSize: { xs: 30, sm: 38, md: 44 },
              fontWeight: 900,
              lineHeight: 1.3,
              letterSpacing: '-.03em',
            }}
          >
            อันดับนักสำรวจ
          </Typography>
          <Typography sx={{ mt: 1.5, maxWidth: 380, color: 'text.secondary', lineHeight: 1.75 }}>
            ร้านไม่ซ้ำที่แจ้งและผ่านอนุมัติ รับ {POINTS_PER_STORE} เหรียญต่อร้าน
            เหรียญเท่ากันได้อันดับร่วม
          </Typography>
          <Button
            href="#leaderboard-results"
            variant="contained"
            endIcon={<Iconify icon="ri:arrow-down-line" />}
            sx={{ mt: 2.5, minHeight: 46, px: 2.5 }}
          >
            ดูอันดับนักสำรวจ
          </Button>
        </Container>
      </Box>
      <Container
        id="leaderboard-results"
        component="section"
        aria-labelledby={monthly ? 'leaderboard-period' : undefined}
        aria-label={monthly ? undefined : 'อันดับสะสม'}
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          mt: monthly ? { xs: -6, md: -5 } : { xs: -22, sm: -23, md: -20 },
          scrollMarginTop: 96,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Stack
            component="nav"
            aria-label="ช่วงเวลาอันดับ"
            direction="row"
            spacing={0.5}
            sx={{
              p: 0.5,
              border: '1px solid #DFD9C9',
              borderRadius: '16px',
              bgcolor: 'background.paper',
            }}
          >
            <Button
              href={`${leaderboardPath}?period=monthly#leaderboard-results`}
              aria-current={monthly ? 'page' : undefined}
              sx={periodTabSx}
            >
              เดือนนี้
            </Button>
            <Button
              href={`${leaderboardPath}?period=all#leaderboard-results`}
              aria-current={monthly ? undefined : 'page'}
              sx={periodTabSx}
            >
              สะสม
            </Button>
          </Stack>
          {!monthly && (
            <Button
              href="/mapza/leaderboard/levels/"
              variant="outlined"
              startIcon={<Iconify icon="ri:map-2-line" />}
              endIcon={<Iconify icon="ri:arrow-right-line" />}
              sx={{
                minHeight: 44,
                px: 1.75,
                border: '2px solid #537859',
                bgcolor: '#FFFDF5',
                color: '#244A35',
                fontWeight: 800,
                '&&:hover': { bgcolor: '#EAF2E0', borderColor: '#346649' },
              }}
            >
              ดูเส้นทางครบ 100 เลเวล
            </Button>
          )}
        </Stack>
        {monthly && (
          <Typography
            id="leaderboard-period"
            component="h2"
            sx={{ mb: 1, fontWeight: 800, color: 'primary.dark' }}
          >
            {periodLabel}
          </Typography>
        )}
        {showPodium && <ExplorerPodium entries={entries} />}
        {error ? (
          <Alert severity="error">โหลดอันดับนักสำรวจไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
        ) : entries.length === 0 ? (
          <Alert severity="info">ยังไม่มีรายงานที่ผ่านอนุมัติในช่วงนี้</Alert>
        ) : null}
        {!error && listEntries.length > 0 && (
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {listEntries.map((entry, index) => (
              <Stack
                component="li"
                key={index}
                direction="row"
                alignItems="center"
                spacing={{ xs: 0.75, sm: 1.5 }}
                sx={{ ...explorerCardSx, p: { xs: 1, sm: 1.5 } }}
              >
                <Typography
                  aria-label={`อันดับ ${entry.placement}`}
                  sx={{
                    minWidth: { xs: 34, sm: 42 },
                    py: 0.5,
                    textAlign: 'center',
                    borderRadius: '8px',
                    bgcolor: podiumColors[entry.placement - 1] ?? 'background.default',
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  #{entry.placement}
                </Typography>
                <Avatar
                  src={entry.avatar_url || undefined}
                  alt=""
                  slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                  sx={{ width: 36, height: 36, bgcolor: 'primary.lighter', color: 'primary.dark' }}
                >
                  {entry.display_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, overflowWrap: 'anywhere' }}>
                    {entry.display_name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {entry.store_count.toLocaleString('th-TH')} ร้าน ·{' '}
                    {entry.province_count.toLocaleString('th-TH')} จังหวัด
                  </Typography>
                </Box>
                <Typography
                  sx={{ flexShrink: 0, color: 'primary.dark', fontSize: 14, fontWeight: 900 }}
                >
                  {(entry.store_count * POINTS_PER_STORE).toLocaleString('th-TH')} เหรียญ
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
