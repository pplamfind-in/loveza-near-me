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

async function createShareImage(
  flavor: string,
  imageUrl: string | null,
  background: string,
  foreground: string,
  isPhoto: boolean
) {
  const [logo, can] = await Promise.all([
    loadImage('/logo/logo-email.png'),
    loadImage(imageUrl || '/assets/loveza/loveza-heart.webp').catch(() =>
      loadImage('/assets/loveza/loveza-heart.webp')
    ),
  ]);
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create vote image');

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

  const logoWidth = 280;
  ctx.drawImage(
    logo,
    (1080 - logoWidth) / 2,
    80,
    logoWidth,
    (logoWidth * logo.naturalHeight) / logo.naturalWidth
  );
  ctx.textAlign = 'center';
  ctx.fillStyle = foreground;
  ctx.font = 'bold 76px "LINE Seed Sans TH", sans-serif';
  ctx.fillText(isPhoto ? 'ขอบคุณที่ร่วมกิจกรรม!' : 'โหวตสำเร็จ!', 540, 324, 920);

  const bounds = isPhoto
    ? { x: 0, y: 0, width: can.naturalWidth, height: can.naturalHeight }
    : getVisibleImageBounds(can);
  const scale = Math.min((isPhoto ? 850 : 475) / bounds.width, 710 / bounds.height, 1);
  const width = bounds.width * scale;
  const height = bounds.height * scale;
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(540, 704);
  if (!isPhoto) ctx.rotate((-8 * Math.PI) / 180);
  ctx.drawImage(
    can,
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

  ctx.font = '38px "LINE Seed Sans TH", sans-serif';
  if (!isPhoto) ctx.fillText('รสที่ฉันเลือก', 540, 1125, 920);
  ctx.font = 'bold 72px "LINE Seed Sans TH", sans-serif';
  ctx.fillText(flavor, 540, 1210, 940);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Cannot export vote image');
  return new File([blob], isPhoto ? 'loveza-hunt-photo.png' : 'loveza-hunt-vote.png', {
    type: 'image/png',
  });
}

export function FlavorPollShare({
  flavor,
  imageUrl,
  secondaryAction,
  isPhoto = false,
}: {
  flavor: string;
  imageUrl: string | null;
  secondaryAction: ReactNode;
  isPhoto?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const main = document.querySelector('main[data-activity-page]');
    const styles = main ? getComputedStyle(main) : getComputedStyle(document.body);
    createShareImage(flavor, imageUrl, styles.backgroundColor, styles.color, isPhoto)
      .then((image) => {
        if (active) setFile(image);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [flavor, imageUrl, isPhoto]);

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
          ดาวน์โหลดภาพ
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
