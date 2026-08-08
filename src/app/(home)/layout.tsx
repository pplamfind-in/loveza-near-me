import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

type Props = {
  children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
