import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

// ----------------------------------------------------------------------

type LoadingStateProps = {
  rows?: number;
};

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={120} sx={{ borderRadius: 5 }} />
      ))}
    </Stack>
  );
}
