import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <HomeLayout {...baseOptions()}>{children}<Footer /></HomeLayout>;
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-fd-card py-12 text-fd-secondary-foreground">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold">Celerity</p>
          <p className="text-xs">
            Copyright © {new Date().getFullYear()} The Celerity documentation authors.
          </p>
        </div>
      </div>
    </footer>
  );
}