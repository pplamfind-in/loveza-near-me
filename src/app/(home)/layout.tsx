import { MainLayout } from 'src/layouts/main';

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <MainLayout slotProps={{ footer: { sx: { display: 'none' } } }}>{children}</MainLayout>;
}
