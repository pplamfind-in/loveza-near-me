import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

type AccountLayoutProps = {
  children: React.ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
