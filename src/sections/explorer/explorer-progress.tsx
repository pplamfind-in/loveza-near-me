'use client';

import Image from 'next/image';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';

import { useExplorerProgressQuery } from 'src/app/account/use-account-reports';

import { Iconify } from 'src/components/iconify';

const coinImage = '/assets/loveza/loveza-coin.webp';

const cardSx = {
  p: { xs: 2, md: 3 },
  border: '5px solid var(--palette-background-paper)',
  borderRadius: '18px',
  bgcolor: 'background.paper',
  boxShadow: '0 4px 0 var(--palette-grey-200)',
};

export function ExplorerProgressPanel() {
  const [coinOpen, setCoinOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useExplorerProgressQuery();
  if (isLoading)
    return (
      <Box sx={cardSx} aria-label="กำลังโหลดภารกิจ">
        <Skeleton width="50%" height={36} />
        <Skeleton height={100} />
        <Skeleton height={60} />
      </Box>
    );
  if (isError || !data)
    return (
      <Alert
        severity="warning"
        action={
          <Button color="inherit" onClick={() => refetch()}>
            ลองอีกครั้ง
          </Button>
        }
      >
        โหลดภารกิจไม่สำเร็จ
      </Alert>
    );
  return (
    <Box
      component="section"
      aria-labelledby="explorer-missions-title"
      sx={{ ...cardSx, background: 'linear-gradient(135deg, #FBF0CD, #E8F0E4 80%)' }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            component="img"
            src="/assets/icons/loveza/voxel-map-pin.svg"
            alt=""
            sx={{ width: 64, height: 64 }}
          />
          <Box>
            <Typography
              sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'primary.dark' }}
            >
              YOUR EXPLORER JOURNEY
            </Typography>
            <Typography
              component="h2"
              id="explorer-missions-title"
              sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 900 }}
            >
              {data.levelName}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              เลเวล {data.level} / 100 · {data.uniqueStores} ร้าน · {data.provinces} จังหวัด
            </Typography>
          </Box>
        </Stack>
        <Chip
          clickable
          aria-haspopup="dialog"
          onClick={() => setCoinOpen(true)}
          icon={<Image src={coinImage} alt="" width={40} height={37} unoptimized />}
          label={`${data.points.toLocaleString('th-TH')} เหรียญ`}
          sx={{
            alignSelf: { xs: 'flex-start', sm: 'center' },
            bgcolor: 'background.paper',
            color: 'primary.dark',
            fontSize: 18,
            fontWeight: 900,
            height: 48,
            borderRadius: '12px',
            '& .MuiChip-icon': { ml: 1, mr: -0.5, objectFit: 'contain' },
          }}
        />
      </Stack>
      <Box sx={{ mt: 2.5 }}>
        <LinearProgress
          variant="determinate"
          value={data.progressPercent}
          aria-label="ความคืบหน้าเลเวลนักสำรวจ"
          sx={{
            height: 12,
            borderRadius: '8px',
            bgcolor: '#ffffffaa',
            '& .MuiLinearProgress-bar': {
              borderRadius: '8px',
              background:
                'repeating-linear-gradient(115deg, #427653, #427653 12px, #6C986A 12px, #6C986A 24px)',
            },
          }}
        />
        <Typography sx={{ mt: 1, color: 'primary.dark', fontSize: 12 }}>
          {data.storesToNextLevel !== null
            ? `อีก ${data.storesToNextLevel} ร้านถึงเลเวล ${data.level + 1}${data.nextLevelTitleUnlock ? ` · ปลดล็อกฉายา “${data.nextLevelTitleUnlock}”` : ''}`
            : 'ถึงเลเวลสูงสุดแล้ว ขอบคุณที่ช่วยเติมแผนที่!'}
        </Typography>
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 3, mb: 1.5 }}
      >
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18 }}>
          ภารกิจของคุณ
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>เวลาไทย</Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        {data.missions.map((mission) => {
          const complete = mission.current >= mission.target;
          return (
            <Box
              key={mission.id}
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: '14px',
                border: '1px solid',
                borderColor: complete ? 'primary.light' : 'transparent',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify
                  icon={complete ? 'ri:checkbox-circle-fill' : 'ri:flag-2-line'}
                  width={22}
                  sx={{ color: 'primary.main' }}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 800, flex: 1 }}>
                  {mission.title}
                </Typography>
                <Typography sx={{ color: 'primary.dark', fontSize: 12, fontWeight: 800 }}>
                  {mission.current}/{mission.target}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary', lineHeight: 1.7 }}>
                {mission.description}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 11,
                  fontWeight: 700,
                  color: complete ? 'primary.dark' : 'text.secondary',
                }}
              >
                {complete
                  ? 'สำเร็จแล้ว ✦'
                  : mission.daily
                    ? 'ภารกิจวันนี้ · เริ่มใหม่เที่ยงคืนไทย'
                    : 'สะสมความคืบหน้าได้ต่อเนื่อง'}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ mt: 2.5 }}
      >
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.8, maxWidth: 540 }}>
          ร้านไม่ซ้ำที่ผ่านอนุมัติรับ 10 เหรียญต่อร้าน นับประวัติเดิมด้วย
          การแจ้งร้านเดิมซ้ำไม่เพิ่มเหรียญ ภารกิจแสดงความคืบหน้าโดยไม่มีเหรียญโบนัส
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0 }}>
          <Button
            href="/rewards/"
            variant="outlined"
            startIcon={<Iconify icon="ri:gift-2-line" />}
            sx={{ minHeight: 44, bgcolor: 'background.paper' }}
          >
            รางวัลทั้งหมด
          </Button>
          <Button
            href="/report/"
            variant="contained"
            startIcon={<Iconify icon="ri:map-pin-add-line" />}
            sx={{ flexShrink: 0, minHeight: 44 }}
          >
            ออกทำภารกิจ
          </Button>
        </Stack>
      </Stack>
      <Dialog
        open={coinOpen}
        onClose={() => setCoinOpen(false)}
        aria-label="ภาพเหรียญ Loveza"
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'transparent',
              backgroundImage: 'none',
              boxShadow: 'none',
              overflow: 'visible',
            },
          },
        }}
      >
        <IconButton
          aria-label="ปิดภาพเหรียญ"
          onClick={() => setCoinOpen(false)}
          sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'background.paper' }}
        >
          <Iconify icon="ri:close-line" />
        </IconButton>
        <DialogContent sx={{ p: 0 }}>
          <Image
            src={coinImage}
            alt="เหรียญทองลาย Loveza"
            width={1312}
            height={1199}
            unoptimized
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
