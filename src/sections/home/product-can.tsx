import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type ProductCanProps = {
  name: string;
  thaiName: string;
  color: string;
  accent: string;
  fruit: string;
  meta: string;
};

export function ProductCan({ name, thaiName, color, accent, fruit, meta }: ProductCanProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          height: { xs: 330, md: 400 },
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          borderRadius: '36px',
          background: `radial-gradient(circle, ${accent}44 0%, ${accent}16 38%, transparent 68%)`,
        }}
      >
        <Box sx={{ position: 'absolute', top: '16%', left: '11%', fontSize: { xs: 42, md: 58 }, transform: 'rotate(-18deg)' }}>
          {fruit}
        </Box>
        <Box sx={{ position: 'absolute', right: '8%', bottom: '14%', fontSize: { xs: 34, md: 48 }, transform: 'rotate(14deg)' }}>
          {fruit}
        </Box>
        <Box
          sx={{
            width: { xs: 132, md: 154 },
            height: { xs: 250, md: 290 },
            zIndex: 1,
            p: 2.2,
            color: '#fff',
            display: 'flex',
            position: 'relative',
            textAlign: 'left',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            borderRadius: '22px 22px 28px 28px',
            background: `linear-gradient(145deg, ${color}, ${accent})`,
            boxShadow: `0 30px 50px ${accent}4d`,
            transform: 'rotate(2deg)',
            '&::before': {
              content: '""',
              top: -4,
              left: 4,
              right: 4,
              height: 12,
              position: 'absolute',
              borderRadius: '50%',
              bgcolor: '#dce1dc',
              border: '3px solid #f7f7f2',
            },
          }}
        >
          <Typography sx={{ mb: 'auto', textAlign: 'center', fontSize: 15, fontWeight: 1000, letterSpacing: -.8 }}>
            LOVE ZA!
          </Typography>
          <Typography sx={{ fontSize: { xs: 26, md: 30 }, lineHeight: .88, fontWeight: 900, letterSpacing: '-.06em' }}>
            {name}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 12, opacity: .85 }}>{thaiName}</Typography>
          <Typography sx={{ mt: 0.6, fontSize: 9, fontWeight: 800, opacity: .78 }}>{meta}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
