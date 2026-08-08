import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';

import { ProductsPanel } from 'src/sections/admin/products-panel';

export const metadata: Metadata = { title: 'จัดการสินค้า | Loveza Admin' };

export default function AdminProductsPage() {
  return (
    <DashboardContent maxWidth="xl">
      <ProductsPanel />
    </DashboardContent>
  );
}
