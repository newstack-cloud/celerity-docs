import '@/app/global.css';
import { Inter } from 'next/font/google';

import { baseUrl, createMetadata } from '@/lib/metadata';
import { Body } from '@/app/layout.client';
import { Provider } from '@/provider';

export const metadata = createMetadata({
  title: {
    template: '%s | Celerity',
    default: 'Celerity',
  },
  description: 'The backend toolkit that gets you moving fast',
  metadataBase: baseUrl,
});

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <Body>
        <Provider>{children}</Provider>
      </Body>
    </html>
  );
}
