import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import {
  rehypeCodeDefaultOptions,
  remarkAdmonition,
  remarkSteps,
} from 'fumadocs-core/mdx-plugins';
import blueprintlangGrammar from './grammars/blueprintlang.tmLanguage.json' with { type: 'json' };

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections#define-docs
export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSteps, remarkAdmonition],
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      langs: [blueprintlangGrammar as never],
    },
  },
});
