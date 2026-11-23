import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
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
    <Box sx={{ containerType: 'inline-size', containerName: 'admin-account' }}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{
          minWidth: 0,
          p: 1.5,
          '@container admin-account (max-width: 120px)': {
            flexDirection: 'column',
            gap: 1,
            px: 0,
            '& > :not(style) ~ :not(style)': { ml: 0 },
            '& [data-admin-account-details]': { display: 'none' },
            '& .MuiIconButton-root': { border: 0 },
          },
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

        <Box data-admin-account-details sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            variant="subtitle2"
            title={displayName}
            sx={{
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
            title={email}
            sx={{
              color: 'text.secondary',
              fontSize: 11,
            }}
          >
            {email}
          </Typography>
        </Box>

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
    </Box>
  );
}
