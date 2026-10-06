import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function NotFound() {
  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
      <Typography variant="h5">ไม่พบกระทู้นี้</Typography>
      <Typography color="text.secondary">กระทู้อาจถูกลบไปแล้ว หรือที่อยู่ไม่ถูกต้อง</Typography>
      <Button href="/forum" variant="contained">
        กลับหน้ากระทู้
      </Button>
    </Stack>
  );
}
