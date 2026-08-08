import type { NavMainProps } from './main/nav/types';

import { Iconify } from 'src/components/iconify';

const commonNavData: NavMainProps['data'] = [
  {
    title: 'หน้าแรก',
    path: '/#home',
    icon: <Iconify width={22} icon="ri:home-5-fill" />,
  },

  {
    title: 'ค้นหาใกล้ฉัน',
    path: '/nearby',
    icon: <Iconify width={22} icon="ri:map-pin-2-fill" />,
  },
];

const guestNavData: NavMainProps['data'] = [
  ...commonNavData,
  {
    title: 'เข้าสู่ระบบ',
    path: '/auth/login',
    icon: <Iconify width={22} icon="ri:login-circle-line" />,
  },
];

const userNavData: NavMainProps['data'] = [
  ...commonNavData,
  {
    title: 'แจ้งพิกัด',
    path: '/report',
    icon: <Iconify width={22} icon="ri:edit-2-fill" />,
  },
];

const adminNavData: NavMainProps['data'] = [
  ...commonNavData,
  {
    title: 'จัดการข้อมูล',
    path: '/admin',
    icon: <Iconify width={22} icon="ri:shield-check-fill" />,
  },
];

export const navData = guestNavData;

export function getMainNavData(authenticated: boolean, role?: string): NavMainProps['data'] {
  if (!authenticated) return guestNavData;
  return role === 'admin' ? adminNavData : userNavData;
}
