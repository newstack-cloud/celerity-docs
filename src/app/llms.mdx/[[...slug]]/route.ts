import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug?: string[] }> },
) {
    const { slug } = await params;

    // First try to get the page with the original slug
    let page = source.getPage(slug);

    // If not found and the slug doesn't end with 'index', try with 'index' appended
    if (!page && slug && slug[slug.length - 1] !== 'index') {
        const slugWithIndex = [...slug, 'index'];
        page = source.getPage(slugWithIndex);
    }

    // If still not found, try without the last segment if it's 'index'
    if (!page && slug && slug[slug.length - 1] === 'index') {
        const slugWithoutIndex = slug.slice(0, -1);
        page = source.getPage(slugWithoutIndex);
    }

    if (!page) notFound();

    return new NextResponse(await getLLMText(page));
}

export function generateStaticParams() {
    const params = source.generateParams();

    // Get all the slug arrays to identify parent paths
    const allSlugs = params.map(param => param.slug || []);

    // Find parent paths (paths that are prefixes of other paths)
    // For example: ['framework', 'applications'] is a parent of ['framework', 'applications', 'resources']
    const parentPaths = new Set<string>();

    for (let i = 0; i < allSlugs.length; i++) {
        for (let j = 0; j < allSlugs.length; j++) {
            if (i !== j) {
                const path1 = allSlugs[i];
                const path2 = allSlugs[j];

                // Check if path1 is a prefix of path2
                if (path1.length < path2.length &&
                    path1.every((segment, index) => segment === path2[index])) {
                    parentPaths.add(path1.join('/'));
                }
            }
        }
    }

    // Create final params with "index" appended to parent paths
    // This ensures that parent paths like ['framework', 'applications'] become ['framework', 'applications', 'index']
    const finalParams = params.map(param => {
        const slugPath = (param.slug || []).join('/');

        if (parentPaths.has(slugPath)) {
            return {
                slug: [...(param.slug || []), 'index']
            };
        }

        return param;
    });

    return finalParams;
}
