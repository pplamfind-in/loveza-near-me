import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';

// ----------------------------------------------------------------------

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
  onRetry,
}: ErrorStateProps) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <ErrorOutlineRounded sx={{ fontSize: 56, color: 'error.main' }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 1 }}>
          ลองใหม่
        </Button>
      )}
    </Stack>
  );
}
