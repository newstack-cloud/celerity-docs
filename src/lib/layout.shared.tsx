import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Logo from '../components/logo';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/newstack-cloud/celerity',
    nav: {
      title: (
        <>
          <Logo width={48} />
          Celerity
        </>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [
      {
        text: 'Documentation',
        url: '/docs/framework',
        secondary: false,
        active: 'nested-url'
      },
      {
        text: 'Blog',
        url: '/blog',
        secondary: false,
        active: 'nested-url'
      }
    ],
  };
}
