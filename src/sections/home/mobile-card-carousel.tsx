'use client';

import 'slick-carousel/slick/slick.css';

import type { ReactNode } from 'react';
import type { Theme, SxProps } from '@mui/material/styles';

import { Children } from 'react';
import Slider from 'react-slick';

import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';

type MobileCardCarouselProps = {
  id?: string;
  label: string;
  count: number;
  gridSx: SxProps<Theme>;
  children: ReactNode;
};

export function MobileCardCarousel({
  id,
  label,
  count,
  gridSx,
  children,
}: MobileCardCarouselProps) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (isMobile && count > 1) {
    return (
      <Box
        id={id}
        role="region"
        aria-label={label}
        sx={{
          mt: 3,
          '& .slick-list': {
            width: 'calc(95% + 16px)',
            ml: -1,
            pb: 0.5,
            overflow: 'visible',
          },
          '& .slick-slide > div': { px: 1 },
        }}
      >
        <Slider
          arrows={false}
          infinite
          slidesToShow={1}
          slidesToScroll={1}
          speed={reduceMotion ? 0 : 300}
        >
          {Children.map(children, (card) => (
            <div>{card}</div>
          ))}
        </Slider>
      </Box>
    );
  }

  return (
    <Box
      id={id}
      sx={[
        (theme) => ({
          display: 'grid',
          ...(count > 1 && {
            [theme.breakpoints.down('sm')]: { '& > :not(:first-child)': { display: 'none' } },
          }),
        }),
        ...(Array.isArray(gridSx) ? gridSx : [gridSx]),
      ]}
    >
      {children}
    </Box>
  );
}
