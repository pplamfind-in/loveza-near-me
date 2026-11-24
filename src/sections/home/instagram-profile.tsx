'use client';

import Script from 'next/script';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type InstagramWindow = Window & { instgrm?: { Embeds: { process: () => void } } };

export function InstagramProfile({ url }: { url: string }) {
  return (
    <Box
      sx={{
        width: { xs: '100%', md: 'min(38%, 400px)' },
        maxWidth: 400,
        minWidth: 0,
        flexShrink: 0,
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        alignSelf: 'center',
        '& .instagram-media, & iframe': {
          minWidth: '0 !important',
          display: 'block',
          boxSizing: 'border-box',
          width: '100% !important',
          maxWidth: '100% !important',
          margin: '0 !important',
        },
      }}
    >
      <Box
        component="blockquote"
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', textAlign: 'center' }}
      >
        <Typography
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          variant="subtitle2"
          sx={{ color: 'primary.dark' }}
        >
          @sungstarwin
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Starwin Narkthongpet
        </Typography>
      </Box>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onReady={() => (window as InstagramWindow).instgrm?.Embeds.process()}
      />
    </Box>
  );
}
