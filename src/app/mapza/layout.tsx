import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

type MapzaLayoutProps = {
  children: React.ReactNode;
};

export default function MapzaLayout({ children }: MapzaLayoutProps) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
