import sharp from 'sharp';

import { MAX_STORED_FORUM_IMAGE_SIZE } from './forum-image';

export async function compressForumImage(input: Buffer) {
  const image = sharp(input, { limitInputPixels: 60000000 }).rotate();
  for (const [dimension, quality] of [
    [2400, 82],
    [2400, 68],
    [1800, 68],
    [1200, 60],
    [800, 50],
  ]) {
    const output = await image
      .clone()
      .resize({ width: dimension, height: dimension, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
    if (output.length <= MAX_STORED_FORUM_IMAGE_SIZE) return output;
  }
  throw new Error('ไม่สามารถลดขนาดรูปให้ต่ำกว่า 2MB ได้');
}
