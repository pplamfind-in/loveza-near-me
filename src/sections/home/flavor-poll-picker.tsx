'use client';

import 'slick-carousel/slick/slick.css';

import Slider from 'react-slick';
import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

type Option = { label: string; imageUrl: string; description: string };

const fallbackImage = '/assets/icons/loveza/icon-question-mark.webp';

export function FlavorPollPicker({ options, canVote }: { options: Option[]; canVote: boolean }) {
  const slider = useRef<Slider>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (!options.length) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
      {canVote && <input type="hidden" name="option" value={options[activeIndex].label} />}
      <Box role="region" aria-label="รสชาติในโพล" sx={{ '& .slick-list': { overflow: 'hidden' } }}>
        <Slider
          ref={slider}
          arrows={false}
          infinite={false}
          lazyLoad="ondemand"
          slidesToShow={1}
          slidesToScroll={1}
          speed={reduceMotion ? 0 : 260}
          beforeChange={(_, next) => setActiveIndex(next)}
        >
          {options.map(({ label, imageUrl, description }, index) => (
            <Box key={label}>
              <Box
                sx={{
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  px: 2,
                  pb: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '100%',
                    height: {
                      xs: 'clamp(220px, 43dvh, 375px)',
                      sm: 'clamp(300px, 48dvh, 485px)',
                    },
                    my: 1,
                  }}
                >
                  <Box
                    component="img"
                    src={imageUrl || fallbackImage}
                    alt=""
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    sx={{
                      width: imageUrl ? 'min(90%, 460px)' : 100,
                      height: imageUrl ? '100%' : 'auto',
                      minHeight: 0,
                      maxHeight: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 12px 16px #0003)',
                      ...(imageUrl && {
                        '--can-tilt': index % 2 === 0 ? '-8deg' : '8deg',
                        transform: 'rotate(var(--can-tilt))',
                        ...(index === activeIndex && {
                          '@media (prefers-reduced-motion: no-preference)': {
                            animation: 'poll-can-pop 440ms cubic-bezier(.22,.75,.3,1) both',
                            '@keyframes poll-can-pop': {
                              '0%': {
                                transform: 'translateY(12px) rotate(0deg) scale(.91)',
                              },
                              '58%': {
                                transform: 'translateY(-8px) rotate(var(--can-tilt)) scale(1.035)',
                              },
                              '100%': {
                                transform: 'translateY(0) rotate(var(--can-tilt)) scale(1)',
                              },
                            },
                          },
                        }),
                      }),
                    }}
                  />
                </Box>
                <Typography component="h2" sx={{ fontSize: { xs: 30, sm: 38 }, fontWeight: 900 }}>
                  {label}
                </Typography>
                {description && (
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {description}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Slider>
      </Box>

      {options.length > 1 && (
        <Box
          role="group"
          aria-label="สลับรสชาติ"
          sx={{
            display: 'grid',
            mt: 'auto',
            gridTemplateColumns: {
              xs: `repeat(${Math.min(6, options.length)}, minmax(0, 1fr))`,
              sm: 'repeat(auto-fit, minmax(76px, 1fr))',
            },
            gap: { xs: 0.5, sm: 0.75 },
            p: { xs: 0.75, sm: 1 },
            borderRadius: { xs: '17px', sm: '22px' },
            border: '1px solid #FFFFFF52',
            bgcolor: 'color-mix(in srgb, var(--activity-primary) 68%, white)',
            boxShadow: '0 5px 16px #00000014',
          }}
        >
          {options.map(({ label, imageUrl }, index) => (
            <Box
              key={label}
              component="button"
              type="button"
              aria-pressed={index === activeIndex}
              onClick={() => slider.current?.slickGoTo(index)}
              sx={{
                display: 'grid',
                justifyItems: 'center',
                alignContent: 'center',
                gap: { xs: 0.25, sm: 0.5 },
                minWidth: 0,
                aspectRatio: '1 / 1',
                p: { xs: 0.25, sm: 0.75 },
                border: '2px solid transparent',
                borderRadius: { xs: '10px', sm: '13px' },
                bgcolor: 'background.paper',
                color: 'text.primary',
                cursor: 'pointer',
                '&:focus-visible': {
                  outline: '2px solid var(--activity-primary)',
                  outlineOffset: 2,
                },
                '&[aria-pressed="true"]': {
                  borderColor: 'var(--activity-primary)',
                  boxShadow: '0 0 0 1px #FFFFFFD9',
                  bgcolor:
                    'color-mix(in srgb, var(--activity-primary) 24%, var(--palette-background-paper))',
                },
              }}
            >
              <Box
                component="img"
                src={imageUrl || fallbackImage}
                alt=""
                decoding="async"
                fetchPriority="low"
                sx={{
                  width: { xs: 20, sm: 31 },
                  height: { xs: 'clamp(20px, 6.8vw, 32px)', sm: 39 },
                  objectFit: 'contain',
                }}
              />
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 'clamp(9px, 2.4vw, 11px)', sm: 12 },
                  lineHeight: 1.15,
                  overflowWrap: 'anywhere',
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
