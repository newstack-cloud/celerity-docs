import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { remarkInclude } from 'fumadocs-mdx/config';
import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';
import fs from 'node:fs/promises';

const processor = remark()
    .use(remarkMdx)
    // needed for Fumadocs MDX
    .use(remarkInclude)
    .use(remarkGfm);

export async function getLLMText(page: InferPageType<typeof source>) {
    const processed = await processor.process({
        path: page.absolutePath,
        value: await fs.readFile(page.absolutePath),
    });

    // note: it doesn't escape frontmatter, it's up to you.
    return `# ${page.data.title}
URL: ${page.url}

${processed.value}`;
}

/**
 * The static export writes a page that has child pages to `<path>/index`, since
 * `<path>` is also their directory (see `generateStaticParams` in
 * `app/llms.mdx/[[...slug]]/route.ts`), so its markdown URL ends in `/index`.
 */
export function toMarkdownUrl(url: string): string {
    const markdownUrl = url.replace('docs', 'llms.mdx');
    const hasChildren = source.getPages().some((page) => page.url.startsWith(`${url}/`));
    return hasChildren ? `${markdownUrl}/index` : markdownUrl;
}
