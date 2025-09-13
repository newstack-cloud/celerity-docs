import { DocsLayout, DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

const docsOptions: DocsLayoutProps = {
  ...baseOptions(),
  tree: source.pageTree,
}
export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout {...docsOptions}>
      {children}
    </DocsLayout>
  );
}
