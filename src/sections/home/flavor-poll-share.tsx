'use client';

import type { ReactNode } from 'react';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

async function loadImage(src: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  await image.decode();
  return image;
}

function getVisibleImageBounds(image: HTMLImageElement) {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, width, height };

  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 16) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = y;
    }
  }
  if (right < left) return { x: 0, y: 0, width, height };
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseline: number,
  maxWidth: number
) {
  const width = ctx.measureText(text).width;
  const scale = width > maxWidth ? maxWidth / width : 1;

  // Measure and position explicitly so text fitting does not change the alignment on iOS.
  ctx.save();
  ctx.translate(ctx.canvas.width / 2, baseline);
  ctx.scale(scale, 1);
  ctx.textAlign = 'left';
  ctx.fillText(text, -width / 2, 0);
  ctx.restore();
}

type KrathongShare = {
  title: string;
  descriptionHtml: string;
  wish: string;
  surroundingImages?: string[];
};

const emptySurroundingImages: string[] = [];

function drawFloatingBasket(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  waterline: number,
  maxWidth: number,
  maxHeight: number
) {
  const bounds = getVisibleImageBounds(image);
  const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height);
  const width = bounds.width * scale;
  const height = bounds.height * scale;
  const x = centerX - width / 2;

  ctx.save();
  ctx.globalAlpha *= 0.22;
  ctx.translate(0, waterline);
  ctx.scale(1, -0.3);
  ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, x, -height, width, height);
  ctx.restore();
  ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, x, waterline - height, width, height);
}

function drawSkyLanterns(ctx: CanvasRenderingContext2D, cardHeight: number) {
  const lanterns = [
    [105, 0.075, 29, -0.13],
    [245, 0.255, 20, 0.14],
    [115, 0.335, 16, -0.1],
    [775, 0.065, 19, 0.12],
    [920, 0.242, 30, 0.16],
    [1010, 0.342, 18, -0.12],
  ];

  for (const [x, y, size, tilt] of lanterns) {
    ctx.save();
    ctx.translate(x, y * cardHeight);
    ctx.rotate(tilt);
    const glow = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    glow.addColorStop(0, '#ed8d45');
    glow.addColorStop(0.78, '#ffc675');
    glow.addColorStop(1, '#fff2b2');
    ctx.shadowColor = '#ffb35499';
    ctx.shadowBlur = size * 0.8;
    ctx.fillStyle = glow;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-size * 0.42, -size / 2, size * 0.84, size, size * 0.18);
    } else {
      ctx.rect(-size * 0.42, -size / 2, size * 0.84, size);
    }
    ctx.fill();
    ctx.restore();
  }
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseline: number,
  lineHeight: number,
  maxWidth: number,
  maxLines: number
) {
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
  const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' });
  const lines: string[] = [];
  let line = '';

  for (const { segment } of segmenter.segment(text.trim().replace(/\s+/g, ' '))) {
    if (ctx.measureText(line + segment).width <= maxWidth) {
      line += segment;
      continue;
    }
    if (line.trim()) lines.push(line.trim());
    line = segment.trimStart();

    if (ctx.measureText(line).width > maxWidth) {
      let part = '';
      for (const { segment: character } of graphemes.segment(line)) {
        if (part && ctx.measureText(part + character).width > maxWidth) {
          lines.push(part);
          part = '';
        }
        part += character;
      }
      line = part;
    }
  }
  if (line.trim()) lines.push(line.trim());

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    const last = Array.from(
      graphemes.segment(visibleLines[maxLines - 1]),
      ({ segment }) => segment
    );
    while (last.length && ctx.measureText(`${last.join('')}…`).width > maxWidth) last.pop();
    visibleLines[maxLines - 1] = `${last.join('').trimEnd()}…`;
  }

  visibleLines.forEach((value, index) =>
    drawCenteredText(ctx, value, baseline + index * lineHeight, maxWidth)
  );
  return baseline + visibleLines.length * lineHeight;
}

async function createShareImage(
  flavor: string,
  imageUrl: string | null,
  background: string,
  foreground: string,
  isPhoto: boolean,
  krathong: KrathongShare | null
) {
  if (isPhoto && !imageUrl) throw new Error('Missing submitted photo');
  const isKrathong = Boolean(krathong);

  const [image, river, surrounding] = await Promise.all([
    isKrathong && !imageUrl
      ? null
      : loadImage(imageUrl || '/assets/loveza/loveza-heart.webp').catch((error) => {
          if (isPhoto || isKrathong) throw error;
          return loadImage('/assets/loveza/loveza-heart.webp');
        }),
    isKrathong ? loadImage('/assets/activities/krathong-wat-arun-twilight.webp') : null,
    Promise.all((krathong?.surroundingImages ?? []).slice(0, 6)
      .map((url) => loadImage(url).catch(() => null))),
    document.fonts.ready,
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  const { width: screenWidth, height: screenHeight } = window.screen;
  const mobileAspect =
    window.matchMedia('(max-width: 899px)').matches && screenWidth && screenHeight
      ? Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight)
      : 16 / 9;
  canvas.height = isKrathong
    ? Math.round(1080 * Math.min(2.25, Math.max(16 / 9, mobileAspect)))
    : 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create vote image');

  if (river && krathong) {
    const cardHeight = canvas.height;
    const sceneWidth = river.naturalHeight * (1080 / cardHeight);
    const sceneX = (river.naturalWidth - sceneWidth) / 2;
    ctx.drawImage(river, sceneX, 0, sceneWidth, river.naturalHeight, 0, 0, 1080, cardHeight);

    const shade = ctx.createLinearGradient(0, 0, 0, cardHeight);
    shade.addColorStop(0, '#100c30d9');
    shade.addColorStop(0.22, '#100c3066');
    shade.addColorStop(0.41, '#100c3000');
    shade.addColorStop(0.69, '#100c3000');
    shade.addColorStop(0.81, '#100c30a6');
    shade.addColorStop(1, '#100c30e8');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 1080, cardHeight);

    drawSkyLanterns(ctx, cardHeight);
    ctx.imageSmoothingQuality = 'high';
    const riverPositions = [
      [275, 0.61, 105], [815, 0.63, 115], [125, 0.66, 125],
      [955, 0.695, 145], [205, 0.75, 165], [855, 0.765, 170],
    ];
    surrounding.forEach((basket, index) => {
      if (!basket) return;
      const [x, y, size] = riverPositions[index];
      drawFloatingBasket(ctx, basket, x, cardHeight * y, size, size);
    });

    const waterline = Math.round(cardHeight * 0.72);
    if (image) {
      drawFloatingBasket(ctx, image, 540, waterline, 350, 330);
    } else {
      ctx.font = '195px sans-serif';
      drawCenteredText(ctx, '🪷', waterline - 15, 350);
    }

    const description =
      new DOMParser().parseFromString(
        krathong.descriptionHtml.replace(/<\/(?:p|div|li|h[1-6]|blockquote)>|<br\s*\/?>/gi, '$& '),
        'text/html'
      ).body.textContent ?? '';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px "LINE Seed Sans TH", sans-serif';
    const descriptionTop = drawTextBlock(ctx, krathong.title, cardHeight * 0.14, 78, 920, 3);
    ctx.font = '36px "LINE Seed Sans TH", sans-serif';
    drawTextBlock(ctx, description, descriptionTop, 48, 870, 4);

    ctx.font = 'bold 55px "LINE Seed Sans TH", sans-serif';
    const wishTop = drawTextBlock(ctx, flavor, cardHeight * 0.795, 63, 930, 2);
    ctx.font = '36px "LINE Seed Sans TH", sans-serif';
    drawTextBlock(ctx, krathong.wish, wishTop - 5, 40, 920, 7);
  } else {
    if (!image) throw new Error('Missing share image');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#FFFFFF28';
    for (const [x, y, size] of [
      [90, 380, 72],
      [972, 585, 96],
      [152, 1030, 58],
      [914, 1140, 38],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = foreground;
    ctx.font = 'bold 76px "LINE Seed Sans TH", sans-serif';
    drawCenteredText(ctx, isPhoto ? 'ขอบคุณที่ร่วมกิจกรรม!' : 'โหวตสำเร็จ!', 324, 920);

    ctx.font = '34px "LINE Seed Sans TH", sans-serif';
    drawCenteredText(ctx, isPhoto ? flavor : 'ขอบคุณที่ร่วมสนุกกับ Loveza Hunt', 385, 920);

    const bounds = isPhoto
      ? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight }
      : getVisibleImageBounds(image);
    const scale = Math.min(
      (isPhoto ? 850 : 475) / bounds.width,
      (isPhoto ? 710 : 620) / bounds.height,
      1
    );
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(540, isPhoto ? 780 : 748);
    if (!isPhoto) ctx.rotate((-8 * Math.PI) / 180);
    ctx.drawImage(
      image,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      -width / 2,
      -height / 2,
      width,
      height
    );
    ctx.restore();

    if (!isPhoto) {
      ctx.font = '38px "LINE Seed Sans TH", sans-serif';
      drawCenteredText(ctx, 'รสที่ฉันเลือก', 1125, 920);
      ctx.font = 'bold 72px "LINE Seed Sans TH", sans-serif';
      drawCenteredText(ctx, flavor, 1210, 940);
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Cannot export vote image');
  const fileName = isKrathong
    ? 'loveza-hunt-krathong.png'
    : isPhoto
      ? 'loveza-hunt-photo.png'
      : 'loveza-hunt-vote.png';
  return new File([blob], fileName, {
    type: 'image/png',
  });
}

export function FlavorPollShare({
  flavor,
  imageUrl,
  secondaryAction,
  isPhoto = false,
  krathong,
}: {
  flavor: string;
  imageUrl: string | null;
  secondaryAction: ReactNode;
  isPhoto?: boolean;
  krathong?: KrathongShare;
}) {
  const isKrathong = Boolean(krathong);
  const {
    title = '',
    descriptionHtml = '',
    wish = '',
    surroundingImages = emptySurroundingImages,
  } = krathong ?? {};
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const main = document.querySelector('main[data-activity-page]');
    const styles = main ? getComputedStyle(main) : getComputedStyle(document.body);
    createShareImage(
      flavor,
      imageUrl,
      styles.backgroundColor,
      styles.color,
      isPhoto,
      isKrathong ? { title, descriptionHtml, wish, surroundingImages } : null
    )
      .then((image) => {
        if (active) setFile(image);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [flavor, imageUrl, isPhoto, isKrathong, title, descriptionHtml, wish, surroundingImages]);

  const downloadImage = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async () => {
    if (!file) return;
    const data = { files: [file] };
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    downloadImage();
  };

  return (
    <Stack alignItems="center" spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          type="button"
          variant="contained"
          startIcon={<Iconify icon="ri:share-forward-line" />}
          loading={!file && !failed}
          disabled={failed}
          onClick={share}
          sx={{
            bgcolor: 'common.white',
            color: 'var(--activity-primary)',
            px: { xs: 1.5, sm: 3 },
            minHeight: 48,
            borderRadius: '14px',
            '&:hover': { bgcolor: 'common.white', filter: 'brightness(.96)' },
          }}
        >
          แชร์ภาพ
        </Button>
        {secondaryAction}
      </Stack>
      {file && (
        <Button type="button" color="inherit" size="small" onClick={downloadImage}>
          {isKrathong ? 'บันทึกภาพ' : 'ดาวน์โหลดภาพ'}
        </Button>
      )}
      {failed && (
        <Typography role="status" variant="body2">
          สร้างภาพสำหรับแชร์ไม่สำเร็จ
        </Typography>
      )}
    </Stack>
  );
}
