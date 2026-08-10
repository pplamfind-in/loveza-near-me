'use client';

import type { LandingBanner } from 'src/types/landing-banner';

import { getImageProps } from 'next/image';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

type HeroBannerMediaProps = {
  banners: LandingBanner[];
};

export function HeroBannerMedia({ banners }: HeroBannerMediaProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  const safeActiveIndex = banners.length ? activeIndex % banners.length : 0;
  const banner = banners[safeActiveIndex] ?? banners[0];
  if (!banner) return null;

  const imageAlt = banner.alt_text || banner.title;
  const { props: desktopImageProps } = getImageProps({
    fill: true,
    priority: safeActiveIndex === 0,
    alt: imageAlt,
    sizes: '(max-width: 768px) 100vw, 1440px',
    src: banner.image_url,
  });
  const { props: mobileImageProps } = getImageProps({
    fill: true,
    priority: safeActiveIndex === 0,
    alt: imageAlt,
    sizes: '100vw',
    src: banner.mobile_image_url || banner.image_url,
  });

  return (
    <Box sx={{ inset: 0, position: 'absolute' }}>
      <picture key={banner.id}>
        <source media="(max-width: 899.95px)" srcSet={mobileImageProps.srcSet} />
        <img {...desktopImageProps} alt={imageAlt} />
      </picture>

      {banners.length > 1 ? (
        <Box
          sx={{
            top: { xs: 16, md: 'auto' },
            right: { xs: 16, md: 24 },
            bottom: { md: 20 },
            zIndex: 4,
            p: 0.5,
            gap: 0.25,
            display: 'flex',
            position: 'absolute',
            borderRadius: 99,
            bgcolor: 'rgba(53,17,41,.36)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {banners.map((item, index) => (
            <IconButton
              key={item.id}
              size="small"
              aria-label={`แสดง Banner ${item.title}`}
              aria-current={index === safeActiveIndex ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
              sx={{ p: 0.75 }}
            >
              <Box
                sx={{
                  width: index === safeActiveIndex ? 18 : 7,
                  height: 7,
                  borderRadius: 99,
                  bgcolor: index === safeActiveIndex ? '#FDE047' : 'rgba(255,255,255,.72)',
                  transition: 'width .2s ease',
                }}
              />
            </IconButton>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
