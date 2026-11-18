import type { ExplorerReward, getRewardProgress } from 'src/lib/explorer/rewards';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

import { ProtectedArtwork } from 'src/sections/rewards/protected-artwork';
import { RewardDownloadButton } from 'src/sections/rewards/download-button';

type RewardCardProps = {
  reward: ExplorerReward;
  index: number;
  status: ReturnType<typeof getRewardProgress>;
  showDetails?: boolean;
};

export function RewardCard({ reward, index, status, showDetails = true }: RewardCardProps) {
  const isLimited = status.schedule.state !== 'always';
  const percent = status.target > 0 ? (status.current / status.target) * 100 : 0;
  const remaining = status.target - status.current;
  const progressMessage =
    status.schedule.state === 'upcoming'
      ? 'รอเปิดกิจกรรม'
      : status.schedule.state === 'ended'
        ? 'สิ้นสุดกิจกรรมแล้ว'
        : `อีก ${remaining} ${status.unit} ก็ปลดล็อกการ์ด!`;
  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'start',
        width: '100%',
        position: 'relative',
        ...(!status.unlocked && {
          aspectRatio: '3 / 4',
          background: 'linear-gradient(150deg, #F1F2F3, #DDE0E3)',
          border: '5px solid white',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: '0 5px 0 #EDE4D7',
        }),
        ...(isLimited && {
          borderRadius: '22px',
          outline: '2px solid #D8AB42',
          outlineOffset: 2,
          boxShadow: '0 6px 0 #D8AB4238, 0 14px 30px #B9801820',
          ...(!status.unlocked && {
            borderColor: '#FFF6D8',
            background:
              'radial-gradient(ellipse at 50% 0%, #FFF3CB88, transparent 65%), linear-gradient(150deg, #F1F2F3, #DDE0E3)',
          }),
        }),
        ...(!showDetails && {
          transition: 'transform 220ms ease, box-shadow 220ms ease',
          '& img, & [data-card-sparkles]': { transition: 'transform 260ms ease' },
          '&:focus-within': {
            transform: 'translateY(-6px)',
            '& img': { transform: 'rotate(-5deg) scale(1.06)' },
          },
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': {
              transform: 'translateY(-8px) rotate(-1.5deg)',
              boxShadow: '0 20px 32px #92641E35',
              '& img': { transform: 'rotate(6deg) scale(1.08)' },
              '& [data-card-sparkles]': { transform: 'translateY(-8px) scale(1.06)' },
            },
          },
          '&:active': { transform: 'translateY(1px) scale(0.98)' },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover, &:focus-within, &:active, & img, & [data-card-sparkles]': {
              transform: 'none !important',
              transition: 'none',
            },
          },
        }),
      }}
    >
      {isLimited && (
        <Chip
          size="small"
          icon={<Iconify icon="ri:vip-crown-2-line" width={17} />}
          label="LIMITED · การ์ดพิเศษ"
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            zIndex: 3,
            background: 'linear-gradient(110deg, #FFE7A0, #FFF6D8, #F1C558)',
            color: '#684515',
            border: '1px solid #D4A340',
            boxShadow: '0 2px 0 #A7742325',
            height: 30,
            fontSize: 10,
            letterSpacing: 0.5,
            '& .MuiChip-icon': { color: '#9D6818' },
            fontWeight: 800,
            borderRadius: '8px',
          }}
        />
      )}
      {status.unlocked && (
        <Box sx={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
          <RewardDownloadButton id={reward.id} iconOnly />
        </Box>
      )}
      <Box
        component="a"
        href={`/rewards/${encodeURIComponent(reward.id)}/`}
        aria-label={`ดูการ์ดเต็ม ${reward.name}`}
        sx={{
          bgcolor: 'background.paper',
          border: '5px solid var(--palette-background-paper)',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: '0 5px 0 #EDE4D7, 0 12px 32px #58452B08',
          transition: 'box-shadow 180ms ease',
          '&:hover': { boxShadow: '0 5px 0 #E4DACB, 0 16px 36px #58452B12' },
          position: 'relative',
          display: 'block',
          '&:focus-visible': { outline: '3px solid #427653', outlineOffset: 4 },
          background: status.unlocked
            ? `radial-gradient(ellipse at 50% 45%, #FFFFFFDD 0%, ${reward.color} 75%)`
            : 'linear-gradient(150deg, #F1F2F3, #DDE0E3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#FFFFFF55 1px, transparent 1px), linear-gradient(90deg, #FFFFFF55 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.45,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            left: '20%',
            right: '20%',
            bottom: 17,
            height: 18,
            borderRadius: '50%',
            bgcolor: '#44362712',
            filter: 'blur(7px)',
          },
          aspectRatio: status.unlocked ? '3 / 4' : '2 / 1',
          ...(!status.unlocked && {
            border: 0,
            borderRadius: 0,
            background: 'transparent',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
            '&::after': { display: 'none' },
            aspectRatio: 'auto',
            flex: 1,
            minHeight: 100,
          }),
          width: '100%',
          flexShrink: 0,
          ...(isLimited &&
            status.unlocked && {
              borderColor: '#FFF6D8',
              background: `radial-gradient(ellipse at 50% 0%, #FFF0B7 0%, transparent 65%), linear-gradient(150deg, #FFFFFFBB, ${reward.color})`,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(#D6A64288 1.5px, transparent 1.5px)',
                backgroundSize: '26px 26px',
                opacity: 0.5,
              },
            }),
        }}
      >
        {isLimited && (
          <Box
            aria-hidden="true"
            data-card-sparkles
            sx={{
              position: 'absolute',
              top: '25%',
              left: 18,
              right: 18,
              display: 'flex',
              justifyContent: 'space-between',
              color: '#BD8826',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <Typography sx={{ fontSize: 24 }}>✦</Typography>
            <Typography sx={{ fontSize: 16, mt: 5 }}>✧</Typography>
          </Box>
        )}
        <ProtectedArtwork>
          <Image
            src={
              status.unlocked
                ? `/assets/illustrations/${reward.character}`
                : '/assets/icons/loveza/icon-question-mark.webp'
            }
            alt={status.unlocked ? `การ์ด ${reward.name}` : 'การ์ดลับ รอคุณมาปลดล็อก'}
            fill
            sizes="(max-width: 599px) 90vw, (max-width: 1199px) 45vw, 370px"
            unoptimized
            style={{
              objectFit: 'contain',
              objectPosition: status.unlocked ? 'center bottom' : 'center',
              padding: status.unlocked ? '12px 12px 0' : '12px',
              zIndex: 1,
            }}
          />
        </ProtectedArtwork>
      </Box>
      {!status.unlocked && showDetails && (
        <Stack
          spacing={1}
          sx={{
            px: status.unlocked ? 0.5 : 2,
            pt: status.unlocked ? 1.5 : 0,
            pb: status.unlocked ? 1 : 2,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Chip
              size="small"
              icon={
                <Iconify icon={status.unlocked ? 'ri:check-line' : 'ri:lock-2-line'} width={14} />
              }
              label={status.unlocked ? 'ปลดล็อกแล้ว' : 'รอการค้นพบ'}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: 'background.paper',
                color: status.unlocked ? 'primary.dark' : 'text.secondary',
                fontSize: 11,
                fontWeight: 800,
                borderRadius: '8px',
                px: 0.5,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />

            <Typography
              sx={{
                fontSize: 10,
                letterSpacing: 1.5,
                color: 'primary.dark',
                fontWeight: 800,
              }}
            >
              CARD / {String(index + 1).padStart(2, '0')}
            </Typography>
          </Stack>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.5 }}>
            {reward.name}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
            {status.condition}
          </Typography>
          {isLimited && (
            <Typography sx={{ fontSize: 11, color: 'primary.dark', fontWeight: 800 }}>
              {status.schedule.label} · เวลาไทย
            </Typography>
          )}
          <Box
            sx={{
              p: 1.25,
              border: '1px solid #E5DBC0',
              borderRadius: '14px',
              bgcolor: '#FFFCF4',
            }}
          >
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'primary.dark' }}>
                ความคืบหน้าภารกิจ
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'primary.dark' }}>
                {status.current} / {status.target} {status.unit}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ my: 0.75 }}>
              <LinearProgress
                variant="determinate"
                value={percent}
                aria-label={`ความคืบหน้ารางวัล ${reward.name}`}
                aria-valuetext={`${status.current} จาก ${status.target} ${status.unit}`}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: 12,
                  borderRadius: '5px',
                  bgcolor: '#E9E4D6',
                  ...(status.target > 1 &&
                    status.target <= 12 && {
                      maskImage:
                        'linear-gradient(to right, #000 0 calc(100% - 3px), transparent 0)',
                      maskSize: `${100 / status.target}% 100%`,
                      maskRepeat: 'repeat-x',
                    }),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: '5px',
                    background: 'linear-gradient(90deg, #306747, #51965E)',
                  },
                }}
              />
              <Box
                aria-hidden="true"
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: '9px',
                  bgcolor: '#F9E7AC',
                  color: '#835916',
                }}
              >
                <Iconify icon="ri:gift-2-line" width={16} />
              </Box>
            </Stack>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
              {progressMessage}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
