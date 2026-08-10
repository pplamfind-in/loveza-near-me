import { Stack } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { LovezaSignOutButton } from 'src/components/auth/loveza-sign-out-button';

type AdminAccountProps = {
  displayName: string;
  email: string;
  photoURL: string;
};

export function AdminAccount({ displayName, email, photoURL }: AdminAccountProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        src={photoURL || undefined}
        alt={displayName}
        imgProps={{ referrerPolicy: 'no-referrer' }}
        sx={{ width: 38, height: 38, bgcolor: '#E5007E', fontWeight: 900 }}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>

      <span style={{ minWidth: 0 }}>
        <Typography noWrap variant="subtitle1" sx={{ maxWidth: 150, fontWeight: 900 }}>
          {displayName}
        </Typography>
        <Typography
          noWrap
          sx={{
            maxWidth: 150,
            color: 'text.secondary',
            display: { xs: 'none', md: 'block' },
            fontSize: 11,
          }}
        >
          {email}
        </Typography>
      </span>

      <Tooltip title="ออกจากระบบ">
        <span>
          <LovezaSignOutButton
            confirm
            iconOnly
            label="ออกจากระบบ Admin"
            confirmDescription="คุณจะต้องเข้าสู่ระบบ Admin อีกครั้งเพื่อจัดการข้อมูลและตั้งค่าระบบ"
            iconButtonProps={{ color: 'inherit' }}
          />
        </span>
      </Tooltip>
    </Stack>
  );
}
