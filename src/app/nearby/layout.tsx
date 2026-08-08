import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

type NearbyLayoutProps = {
  children: React.ReactNode;
};

export default function NearbyLayout({ children }: NearbyLayoutProps) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
