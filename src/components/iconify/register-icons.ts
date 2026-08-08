import { addCollection } from '@iconify/react';
import { icons as remixIcons } from '@iconify-json/ri';

export type IconifyName = string;

let areIconsRegistered = false;

export function registerIcons() {
  if (areIconsRegistered) return;

  addCollection(remixIcons);
  areIconsRegistered = true;
}
