import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
