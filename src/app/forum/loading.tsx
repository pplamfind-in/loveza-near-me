import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <Stack spacing={2} aria-label="กำลังโหลดกระทู้" aria-busy="true">
      {[0, 1, 2].map((id) => (
        <Skeleton key={id} variant="rounded" height={140} />
      ))}
    </Stack>
  );
}
