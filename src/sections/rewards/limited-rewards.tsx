import type { ComponentProps } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { RewardCard } from './reward-card';

export function LimitedRewards({ cards }: { cards: ComponentProps<typeof RewardCard>[] }) {
  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#8B631C', px: 0.5 }}>
        <Iconify icon="ri:time-line" width={18} />
        <Typography component="h2" sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>
          ภารกิจพิเศษ · มีเวลาจำกัด
        </Typography>
      </Stack>
      {cards.map((card) => (
        <RewardCard key={card.reward.id} {...card} />
      ))}
    </Stack>
  );
}
