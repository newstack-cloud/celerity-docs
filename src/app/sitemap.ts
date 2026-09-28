import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import type { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/metadata';
import { source } from '@/lib/source';

export const revalidate = false;

const exec = promisify(execFile);

/**
 * Last commit time per tracked file, keyed by absolute path.
 *
 * The docs collection is async, so `page.data` carries frontmatter and a
 * `load()` and nothing else. `lastModifiedTime: 'git'` does produce the date,
 * but in async mode it is only reachable through that `load()`, which compiles
 * the MDX. Compiling every page to read a date would undo what async mode is
 * for, so the sitemap asks git itself.
 *
 * One `git log` pass rather than a call per file. Commits arrive newest first,
 * so the first time a path appears is its latest change.
 */
async function lastModifiedByFile(): Promise<Map<string, number>> {
    const modified = new Map<string, number>();

    try {
        const [{ stdout: root }, { stdout: log }] = await Promise.all([
            exec('git', ['rev-parse', '--show-toplevel']),
            exec(
                'git',
                [
                    'log',
                    // NUL-prefixed, since a path can hold anything but a NUL
                    // byte and so can never be mistaken for a commit line.
                    '--pretty=format:%x00%ct',
                    '--name-only',
                    '--diff-filter=ACMRT',
                ],
                { maxBuffer: 64 * 1024 * 1024 },
            ),
        ]);

        const repoRoot = root.trim();
        let committedAt = 0;

        for (const line of log.split('\n')) {
            if (line === '') continue;

            if (line.startsWith('\0')) {
                committedAt = Number(line.slice(1)) * 1000;
                continue;
            }

            const absolutePath = path.join(repoRoot, line);
            if (!modified.has(absolutePath)) {
                modified.set(absolutePath, committedAt);
            }
        }
    } catch {
        // No usable history, such as a shallow clone or an export with no .git.
        // Pages then carry no lastModified, which is valid in a sitemap.
    }

    return modified;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const url = (pathname: string): string =>
        new URL(pathname, baseUrl).toString();
    const modified = await lastModifiedByFile();

    return [
        {
            url: url('/'),
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: url('/docs'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        ...source.getPages().map((page) => {
            const lastModified = modified.get(page.data._file.absolutePath);

            return {
                url: url(page.url),
                lastModified: lastModified ? new Date(lastModified) : undefined,
                changeFrequency: 'weekly',
                priority: 0.5,
            } as MetadataRoute.Sitemap[number];
        }),
    ];
}
