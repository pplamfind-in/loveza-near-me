'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPageView({ eyebrow, title, intro, sections }: LegalPageViewProps) {
  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 5, md: 8 }, bgcolor: '#FFF1F8' }}>
      <Container maxWidth="md" sx={{ py: 3, pt: '60px' }}>
        <Box
          sx={{
            p: { xs: 3.5, md: 6 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '40px' },
            bgcolor: '#E5007E',
            boxShadow: '8px 9px 0 #351129',
          }}
        >
          <Typography sx={{ color: '#FDE047', fontSize: 12, fontWeight: 1000, letterSpacing: 2 }}>
            {eyebrow}
          </Typography>
          <Typography
            component="h1"
            sx={{ mt: 1.5, fontSize: { xs: 40, md: 60 }, lineHeight: 1, fontWeight: 1000 }}
          >
            {title}
          </Typography>
          <Typography
            sx={{ mt: 2.5, color: '#FFF0F8', fontSize: { xs: 15, md: 17 }, lineHeight: 1.8 }}
          >
            {intro}
          </Typography>
          <Typography sx={{ mt: 2, color: '#FFD9ED', fontSize: 12 }}>
            ปรับปรุงล่าสุด: 11 สิงหาคม 2569
          </Typography>
        </Box>

        <Stack spacing={2.5} sx={{ mt: 4 }}>
          {sections.map((section, index) => (
            <Box
              component="section"
              key={section.title}
              sx={{
                p: { xs: 3, md: 4 },
                border: '2px solid #351129',
                borderRadius: '24px',
                bgcolor: '#fff',
                boxShadow: '4px 5px 0 #351129',
              }}
            >
              <Typography
                component="h2"
                sx={{ color: '#351129', fontSize: { xs: 22, md: 26 }, fontWeight: 1000 }}
              >
                {index + 1}. {section.title}
              </Typography>
              {section.paragraphs?.map((paragraph) => (
                <Typography key={paragraph} sx={{ mt: 1.5, color: '#5B3A50', lineHeight: 1.85 }}>
                  {paragraph}
                </Typography>
              ))}
              {section.items ? (
                <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 3, color: '#5B3A50' }}>
                  {section.items.map((item) => (
                    <Typography component="li" key={item} sx={{ mb: 1, pl: 0.5, lineHeight: 1.75 }}>
                      {item}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: '20px',
            bgcolor: '#FDE047',
            border: '2px solid #351129',
          }}
        >
          <Typography sx={{ color: '#351129', fontWeight: 900 }}>
            ต้องการสอบถาม ใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคล หรือขอแก้ไข/ลบข้อมูล?{' '}
            <Link href="/contact-us/#contact-form" color="inherit" fontWeight={1000}>
              ส่งคำขอผ่านแบบฟอร์มติดต่อ
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
