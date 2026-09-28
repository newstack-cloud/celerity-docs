import { source } from '@/lib/source';
import type { DocumentRecord } from 'fumadocs-core/search/algolia';

export async function exportSearchIndexes() {
    const results: DocumentRecord[] = [];
    for (const page of source.getPages()) {
        // The docs collection is async, so the compiled output, structured
        // search data included, arrives through load() rather than sitting on
        // page.data. Awaited one page at a time rather than all at once, since
        // this compiles every MDX file in the docs set.
        const { structuredData } = await page.data.load();

        results.push({
            _id: page.url,
            structured: structuredData,
            url: page.url,
            title: page.data.title,
            description: page.data.description,
        });
    }
    return results;
}
