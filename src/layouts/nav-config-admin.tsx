import type { NavSectionProps } from 'src/components/nav-section';

import { Iconify } from 'src/components/iconify';

const navIcon = (name: string) => <Iconify icon={name} width={24} />;

export const adminNavData: NavSectionProps['data'] = [
  {
    subheader: 'จัดการข้อมูล',
    items: [
      {
        title: 'ตรวจสอบพิกัด',
        path: '/admin',
        icon: navIcon('ri:map-pin-user-fill'),
      },
      {
        title: 'พิกัดทั้งหมด',
        path: '/admin/locations',
        icon: navIcon('ri:map-2-fill'),
      },
      {
        title: 'จัดการสินค้า',
        path: '/admin/products',
        icon: navIcon('ri:drinks-2-fill'),
      },
      {
        title: 'จัดการ Banner',
        path: '/admin/banners',
        icon: navIcon('ri:image-2-fill'),
      },
      {
        title: 'ร้านค้า',
        path: '/admin/store-types',
        icon: navIcon('ri:store-3-fill'),
      },
      {
        title: 'ผู้ใช้งาน',
        path: '/admin/users',
        icon: navIcon('ri:group-fill'),
      },
      {
        title: 'สถิติการเข้าใช้งาน',
        path: '/admin/analytics',
        icon: navIcon('ri:line-chart-fill'),
      },
      {
        title: 'ตั้งค่าระบบ',
        path: '/admin/settings',
        icon: navIcon('ri:settings-3-fill'),
      },
      {
        title: 'คู่มือระบบ',
        path: '/admin/guide',
        icon: navIcon('ri:book-2-fill'),
      },
    ],
  },
];
