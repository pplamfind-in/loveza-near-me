import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export type LovezaHeaderUser = {
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
};

type LovezaHeaderAccountProps = {
  user: LovezaHeaderUser;
  mobile?: boolean;
};

export function LovezaHeaderAccount({ user, mobile = false }: LovezaHeaderAccountProps) {
  return (
    <Button
      href="/account"
      aria-label={`บัญชีของ ${user.displayName}`}
      sx={{
        gap: 1,
        p: 0.75,
        minWidth: 0,
        maxWidth: mobile ? 1 : 210,
        color: 'text.primary',
        borderRadius: 99,
        justifyContent: 'flex-start',
        textTransform: 'none',
        bgcolor: 'rgba(255,255,255,.72)',
      }}
    >
      <Avatar
        src={user.photoURL || undefined}
        alt={user.displayName}
        imgProps={{ referrerPolicy: 'no-referrer' }}
        sx={{ width: 38, height: 38, bgcolor: '#ef2382', fontWeight: 900 }}
      >
        {user.displayName.charAt(0).toUpperCase()}
      </Avatar>
      <span style={{ minWidth: 0, textAlign: 'left' }}>
        <Typography noWrap sx={{ maxWidth: mobile ? 190 : 130, fontSize: 13, fontWeight: 900 }}>
          {user.displayName}
        </Typography>
        <Typography
          noWrap
          sx={{
            maxWidth: mobile ? 190 : 130,
            color: 'text.secondary',
            display: { xs: mobile ? 'block' : 'none', xl: 'block' },
            fontSize: 11,
          }}
        >
          {user.email}
        </Typography>
      </span>
    </Button>
  );
}
