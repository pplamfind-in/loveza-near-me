import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

import { ForumShell } from 'src/sections/forum/forum-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LovezaMainLayout>
      <ForumShell>{children}</ForumShell>
    </LovezaMainLayout>
  );
}
