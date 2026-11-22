import type { Metadata } from "next";

export function createMetadata(override: Metadata): Metadata {
    return {
        ...override,
        openGraph: {
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            url: 'https://celerityframework.io',
            images: '/banner.png',
            siteName: 'Celerity',
            ...override.openGraph,
        },
        twitter: {
            card: 'summary_large_image',
            creator: '@newstackcloud',
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            images: '/banner.png',
            ...override.twitter,
        },
        alternates: {
            types: {
                'application/rss+xml': [
                    {
                        title: 'Celerity Blog',
                        url: 'https://celerityframework.io/blog/rss.xml',
                    },
                ],
            },
            ...override.alternates,
        },
    };
}

// The site is a static export served from GitHub Pages at celerityframework.io.
export const baseUrl =
    process.env.NODE_ENV === 'development'
        ? new URL('http://localhost:3000')
        : new URL('https://celerityframework.io');
