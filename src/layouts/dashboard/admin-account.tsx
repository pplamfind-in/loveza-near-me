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
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        minWidth: 0,
        maxWidth: { xs: 230, sm: 340 },
        py: 0.75,
        pl: 0.75,
        pr: 1,
      }}
    >
      <Avatar
        src={photoURL || undefined}
        alt={displayName}
        imgProps={{ referrerPolicy: 'no-referrer' }}
        sx={{ width: 34, height: 34, flexShrink: 0, bgcolor: 'primary.main', fontWeight: 900 }}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>

      <span style={{ minWidth: 0 }}>
        <Typography
          noWrap
          variant="subtitle2"
          sx={{
            maxWidth: { xs: 110, sm: 180 },
            fontSize: 13,
            fontWeight: 800,
            color: 'primary.dark',
            lineHeight: 1.5,
          }}
        >
          {displayName}
        </Typography>
        <Typography
          noWrap
          sx={{
            maxWidth: 180,
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
            iconButtonProps={{
              color: 'inherit',
              sx: {
                width: 34,
                height: 34,
                borderLeft: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'primary.lighter', color: 'primary.dark' },
              },
            }}
          />
        </span>
      </Tooltip>
    </Stack>
  );
}
