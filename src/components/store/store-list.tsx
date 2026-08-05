import type { StoreWithDistance } from 'src/types/store';

import Stack from '@mui/material/Stack';

import { StoreCard } from './store-card';

// ----------------------------------------------------------------------

type StoreListProps = {
  stores: StoreWithDistance[];
};

export function StoreList({ stores }: StoreListProps) {
  return (
    <Stack spacing={2}>
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </Stack>
  );
}
