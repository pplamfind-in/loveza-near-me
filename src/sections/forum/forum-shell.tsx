import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function ForumShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: '#FFF1F8', minHeight: '100vh', py: '100px' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            border: '3px solid #351129',
            borderRadius: 4,
            boxShadow: '6px 6px 0 #351129',
            background: 'linear-gradient(135deg, #7C3AED, #E5007E)',
            color: 'white',
          }}
        >
          <Typography sx={{ color: '#FDE047', fontWeight: 800, letterSpacing: 2 }}>
            LOVEZA COMMUNITY
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            กระทู้สนทนา ✦
          </Typography>
          <Typography sx={{ mt: 1 }}>
            แชร์ร้านเด็ด รีวิวความซ่า และพูดคุยกับเพื่อน ๆ สาย Loveza
          </Typography>
        </Box>
        {children}
      </Container>
    </Box>
  );
}
