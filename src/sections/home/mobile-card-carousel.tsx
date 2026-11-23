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
  paginated?: boolean;
  gridSx: SxProps<Theme>;
  children: ReactNode;
};

export function MobileCardCarousel({
  id,
  label,
  count,
  paginated = false,
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
          mt: paginated ? 0 : 3,
          '& .slick-list': {
            width: paginated ? '100%' : 'calc(95% + 16px)',
            ml: paginated ? 0 : -1,
            pb: 0.5,
            overflow: paginated ? 'hidden' : 'visible',
          },
          '& .slick-slide > div': { px: paginated ? 0.5 : 1 },
          ...(paginated && {
            '& .slick-dots': {
              display: 'flex !important',
              justifyContent: 'center',
              listStyle: 'none',
              m: 0,
              mt: 1,
              p: 0,
            },
            '& .slick-dots button': {
              display: 'grid',
              placeItems: 'center',
              width: 28,
              height: 28,
              border: 0,
              borderRadius: '50%',
              bgcolor: 'transparent',
              color: 'text.secondary',
              cursor: 'pointer',
              '&::before': {
                content: '""',
                width: 8,
                height: 8,
                border: '1px solid currentColor',
                borderRadius: '50%',
              },
            },
            '& .slick-active button::before': {
              bgcolor: 'primary.main',
              borderColor: 'primary.main',
            },
          }),
        }}
      >
        <Slider
          arrows={false}
          infinite={!paginated}
          dots={paginated}
          customPaging={
            paginated
              ? (index) => <button type="button" aria-label={`ดูตัวเลือกที่ ${index + 1}`} />
              : undefined
          }
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
