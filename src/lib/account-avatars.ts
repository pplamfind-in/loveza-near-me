'use server';

import path from 'node:path';
import { readdir } from 'node:fs/promises';

const AVATAR_FOLDERS = ['avatar', 'assets/avatar'] as const;

export async function getAccountAvatars(): Promise<string[]> {
  const groups = await Promise.all(
    AVATAR_FOLDERS.map(async (folder) => {
      try {
        const files = await readdir(path.join(process.cwd(), 'public', folder), {
          withFileTypes: true,
        });
        return files
          .filter((file) => file.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(file.name))
          .map((file) => `/${folder}/${encodeURIComponent(file.name)}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
      }
    })
  );
  return groups.flat().sort();
}
