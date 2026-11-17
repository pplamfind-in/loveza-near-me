import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type ProductCanProps = {
  name: string;
  thaiName: string;
  color: string;
  accent: string;
  fruit: string;
  meta: string;
  imageUrl?: string | null;
};

export function ProductCan({
  name,
  thaiName,
  color,
  accent,
  fruit,
  meta,
  imageUrl,
}: ProductCanProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          height: { xs: 300, md: 320 },
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          borderRadius: '16px 16px 0 0',
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={`${name} ${thaiName}`}
            sx={{
              width: '85%',
              maxWidth: 290,
              height: { xs: 260, md: 280 },
              zIndex: 1,
              objectFit: 'contain',
              filter: `drop-shadow(0 12px 18px ${accent}22)`,
            }}
          />
        ) : (
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
            <Typography
              sx={{
                mb: 'auto',
                textAlign: 'center',
                fontSize: 15,
                fontWeight: 1000,
                letterSpacing: -0.8,
              }}
            >
              LOVE ZA!
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 26, md: 30 },
                lineHeight: 0.88,
                fontWeight: 900,
                letterSpacing: '-.06em',
              }}
            >
              {name}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 12, opacity: 0.85 }}>{thaiName}</Typography>
            <Typography sx={{ mt: 0.6, fontSize: 9, fontWeight: 800, opacity: 0.78 }}>
              {meta}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
