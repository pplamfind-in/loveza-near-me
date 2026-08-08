import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

type ReportLayoutProps = {
  children: React.ReactNode;
};

export default function ReportLayout({ children }: ReportLayoutProps) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
