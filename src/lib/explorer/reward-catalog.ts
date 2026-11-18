'use server';

import path from 'node:path';
import { readdir } from 'node:fs/promises';

export async function getRewardCharacters() {
  const files = await readdir(path.join(process.cwd(), 'public/assets/illustrations'), {
    withFileTypes: true,
  });
  return files
    .filter((file) => file.isFile() && /^p-[a-z0-9-]+\.webp$/.test(file.name))
    .map((file) => file.name)
    .sort();
}
