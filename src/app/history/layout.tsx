import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

type HistoryLayoutProps = {
  children: React.ReactNode;
};

export default function HistoryLayout({ children }: HistoryLayoutProps) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
