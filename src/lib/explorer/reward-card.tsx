import type { ExplorerReward } from './rewards';

import sharp from 'sharp';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';

import { REWARD_CARD_HEADER } from './rewards';

export async function renderRewardCard(reward: ExplorerReward) {
  const [image, font] = await Promise.all([
    sharp(path.join(process.cwd(), 'public/assets/illustrations', reward.character))
      .trim()
      .resize({
        width: 868,
        height: 1050,
        fit: 'contain',
        position: 'bottom',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
    readFile(path.join(process.cwd(), 'public/fonts/LINESeedSansTH-Bold.ttf')),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'transparent',
        fontFamily: 'LineSeed',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          border: '8px solid white',
          borderRadius: 40,
          background: `linear-gradient(160deg, #ffffff, ${reward.color})`,
          padding: '44px 44px 0',
          alignItems: 'center',
          color: '#2E251E',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            fontSize: 22,
            color: REWARD_CARD_HEADER.color,
          }}
        >
          <span>{REWARD_CARD_HEADER.brand}</span>
          <span>{REWARD_CARD_HEADER.label}</span>
        </div>
        {/* Embedded local image keeps the exported card independent of external hosts. */}
        <img
          src={`data:image/png;base64,${image.toString('base64')}`}
          width={868}
          height={1050}
          alt=""
          style={{ objectFit: 'contain', position: 'absolute', bottom: 0, left: 8 }}
        />
      </div>
    </div>,
    {
      width: 900,
      height: 1300,
      fonts: [{ name: 'LineSeed', data: font, weight: 700, style: 'normal' }],
    }
  );
}
