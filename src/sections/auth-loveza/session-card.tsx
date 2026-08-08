import type { User } from '@supabase/supabase-js';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { signOutAction } from 'src/app/auth/actions';

type SessionCardProps = {
  user: User;
  role: 'admin' | 'user';
};

export function SessionCard({ user, role }: SessionCardProps) {
  const displayName = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email;

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', p: { xs: 3, md: 5 }, borderRadius: '30px', bgcolor: '#fff', boxShadow: '0 24px 70px rgba(52,78,82,.12)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            ACTIVE SESSION
          </Typography>
          <Typography component="h1" sx={{ mt: 1.5, fontSize: { xs: 32, md: 44 }, fontWeight: 900 }}>
            สวัสดี {displayName}
          </Typography>
          <Typography sx={{ mt: 1, color: '#77807e' }}>{user.email}</Typography>
        </Box>
        <Chip label={role === 'admin' ? 'ADMIN' : 'GOOGLE USER'} color={role === 'admin' ? 'secondary' : 'success'} />
      </Stack>

      <Typography sx={{ mt: 4, p: 2, color: '#5c6865', borderRadius: '16px', bgcolor: '#f4f9f8', lineHeight: 1.7 }}>
        Session ของคุณถูกตรวจสอบจาก secure cookie ฝั่ง server เรียบร้อยแล้ว
      </Typography>

      <Stack component="form" action={signOutAction} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
        <Button href="/#finder" variant="contained" sx={{ borderRadius: 99, bgcolor: '#ef2382', '&:hover': { bgcolor: '#d91873' } }}>
          กลับไปค้นหา Loveza
        </Button>
        <Button type="submit" color="inherit" sx={{ borderRadius: 99 }}>
          ออกจากระบบ
        </Button>
      </Stack>
    </Box>
  );
}
