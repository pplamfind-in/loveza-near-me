import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { signOutAction } from 'src/app/auth/actions';

import { Iconify } from 'src/components/iconify';

type AdminAccountProps = {
  displayName: string;
  email: string;
  photoURL: string;
};

export function AdminAccount({ displayName, email, photoURL }: AdminAccountProps) {
  return (
    <>
      <Avatar
        src={photoURL || undefined}
        alt={displayName}
        imgProps={{ referrerPolicy: 'no-referrer' }}
        sx={{ width: 38, height: 38, bgcolor: '#ef2382', fontWeight: 900 }}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>

      <span style={{ minWidth: 0 }}>
        <Typography noWrap sx={{ maxWidth: 150, fontSize: 13, fontWeight: 900 }}>
          {displayName}
        </Typography>
        <Typography
          noWrap
          sx={{ maxWidth: 150, color: 'text.secondary', display: { xs: 'none', md: 'block' }, fontSize: 11 }}
        >
          {email}
        </Typography>
      </span>

      <Tooltip title="ออกจากระบบ">
        <form action={signOutAction}>
          <IconButton type="submit" aria-label="ออกจากระบบ Admin" color="inherit">
            <Iconify icon="ri:logout-box-r-line" width={22} />
          </IconButton>
        </form>
      </Tooltip>
    </>
  );
}
