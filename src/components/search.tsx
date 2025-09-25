'use client';

import {
    SearchDialog,
    SearchDialogClose,
    SearchDialogContent,
    SearchDialogFooter,
    SearchDialogHeader,
    SearchDialogIcon,
    SearchDialogInput,
    SearchDialogList,
    SearchDialogOverlay,
    type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { HighlightResultOption, Hit, LiteClient, liteClient } from 'algoliasearch/lite';
import { SortedResult } from 'fumadocs-core/server';
import { Fragment, ReactNode, useEffect, useState } from 'react';
import { BaseIndex } from 'fumadocs-core/search/algolia';
import { HighlightedText } from 'fumadocs-core/search/server';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const client = liteClient(appId, apiKey);

export default function CustomSearchDialog(props: SharedProps) {
    const { search, setSearch, query } = useAlgoliaSearch({
        client,
        indexName,
    });

    return (
        <SearchDialog
            search={search}
            onSearchChange={setSearch}
            isLoading={query.isLoading}
            {...props}
        >
            <SearchDialogOverlay />
            <SearchDialogContent>
                <SearchDialogHeader>
                    <SearchDialogIcon />
                    <SearchDialogInput />
                    <SearchDialogClose />
                </SearchDialogHeader>
                <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
                <SearchDialogFooter>
                    <div className="flex items-center gap-2">
                        <a
                            href="https://www.algolia.com/?utm_medium=AOS-referral"
                            className="ms-auto text-xs text-fd-muted-foreground"
                        >
                            Search powered by Algolia
                        </a>
                        <img src="/assets/Algolia-mark-circle-blue.svg" alt="Algolia" className="size-6 dark:hidden" />
                        <img src="/assets/Algolia-mark-circle-white.svg" alt="Algolia" className="size-6 hidden dark:block" />
                    </div>
                </SearchDialogFooter>
            </SearchDialogContent>
        </SearchDialog>
    );
}

type AlgoliaSearchParams = {
    client: LiteClient;
    indexName: string;
};

type ReactSortedResult = Omit<SortedResult, 'content'> & {
    external?: boolean;
    content: ReactNode;
};

type AlgoliaSearchValues = {
    search: string;
    setSearch: (search: string) => void;
    query: AlgoliaSearchQuery;
}

type AlgoliaSearchQuery = {
    isLoading: boolean;
    data: ReactSortedResult[] | 'empty';
}

function useAlgoliaSearch({ client, indexName }: AlgoliaSearchParams): AlgoliaSearchValues {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState<AlgoliaSearchQuery>({
        isLoading: false,
        data: 'empty',
    });

    useEffect(() => {
        if (search.trim() === '') {
            setQuery({
                isLoading: false,
                data: 'empty',
            });
            return;
        }

        setQuery({
            isLoading: true,
            data: 'empty',
        })

        client.searchForHits<BaseIndex>({
            requests: [{
                type: 'default',
                indexName,
                query: search,
                distinct: 5,
                hitsPerPage: 10,
            }]
        }).then((data) => {
            setQuery({
                isLoading: false,
                data: groupResults(data.results[0].hits),
            });
        })

    }, [search, setQuery, client, indexName]);

    return {
        search,
        setSearch,
        query,
    };
}

function groupResults(hits: Hit<BaseIndex>[]): ReactSortedResult[] {
    const grouped: ReactSortedResult[] = [];
    const scannedUrls = new Set<string>();

    for (const hit of hits) {
        if (!scannedUrls.has(hit.url)) {
            scannedUrls.add(hit.url);

            const sortedResult = {
                id: hit.url,
                type: 'page',
                url: hit.url,
                content: highlightTitle(hit),
            } as const;
            grouped.push(sortedResult);
            console.log({ hit, sortedResult })
        }

        grouped.push({
            id: hit.objectID,
            type: hit.content === hit.section ? 'heading' : 'text',
            url: hit.section_id ? `${hit.url}#${hit.section_id}` : hit.url,
            content: highlightContent(hit),
        });
    }

    return grouped;
}


function highlightTitle(hit: Hit<BaseIndex>): ReactNode {
    if ((hit._highlightResult?.title as HighlightResultOption)?.matchLevel === 'none') {
        return hit.title;
    }

    return (
        <span
            className="search-highlight"
            dangerouslySetInnerHTML={{ __html: (hit._highlightResult?.title as HighlightResultOption)?.value ?? hit.title }}
        />
    );
}

function highlightContent(hit: Hit<BaseIndex>): ReactNode {
    if ((hit._highlightResult?.content as HighlightResultOption)?.matchLevel === 'none') {
        return hit.content;
    }

    return (
        <span
            className="search-highlight"
            dangerouslySetInnerHTML={{ __html: (hit._highlightResult?.content as HighlightResultOption)?.value ?? hit.content }}
        />
    );
}
