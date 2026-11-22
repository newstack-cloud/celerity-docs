# Celerity Docs

The Celerity documentation site at celerityframework.io: a Next.js and Fumadocs site, exported
statically and deployed to GitHub Pages. It documents the Celerity framework and its resource
types, the CLI, the runtimes and the SDKs, and publishes the handler manifest schema.

## Workspace

This repo is one of NewStack's. NewStack's maintainers develop it alongside the others in a
shared workspace, using the NewStack Claude Code plugin for how work is planned, reviewed,
committed and coordinated across repos. The plugin isn't public, and nothing here depends on it:
this file and the repo's own docs cover what a contribution needs.

## Layout

| Path | Holds |
|---|---|
| `content/docs/` | The docs, in MDX, one folder per section (`framework`, `cli`, the runtimes, `go-sdk`), ordered by `meta.json`. `index.mdx` is the `/docs` landing page linking each section |
| `public/schemas/handler-manifest.v1.schema.json` | A copy of the Node SDK's handler manifest schema, served at the URL its `$id` names |
| `src/` | The site: `app/` (pages, plus the `static.json` search export and `llms` routes), `components/`, `lib/`, `data/` (release data) |
| `grammars/blueprintlang.tmLanguage.json` | A copy of bluelink-vscode's grammar, for highlighting `blueprintlang` blocks |
| `scripts/` | Build steps: release data, link checks, search index sync |

## Checks

- **Tools:** Node 22 (the deploy workflow's) with Yarn 4 through corepack (`packageManager`).
  `yarn install --immutable` first, which also runs `fumadocs-mdx`.
- **Release data:** `src/data/releases.json` is a committed stub, so `yarn dev` and
  `next build` work without fetching. `yarn fetch-releases` overwrites it from the GitHub API;
  restore it rather than commit the result, unless asked to refresh it.
- **Checks,** before a change reaches `main`: `yarn lint`, `yarn check-links`, then
  `yarn next build`, which type-checks, lints, fails on MDX errors and fetches the Inter font
  over the network. `yarn check-links` catches broken links to non-docs routes only: every
  `/docs/...` link passes, so after moving or renaming a page, grep `content/` for the old
  path.
- **Don't run `yarn build` as a check.** It runs `fetch-releases`, `check-links`, `next build`
  and `post-build`, then `sync-content`, which replaces the production Algolia search index
  using the secret key from the environment or `.env` (and fails without one, after the site
  is built).
- **Gates:** no git hooks, no commitlint, and no build on pull requests. `deploy.yml` runs on
  pushes to `main`. `schema-sync.yml` fails when the schema copy differs, byte for byte, from
  the Node SDK's `main`: on pushes to `main` and pull requests that change `public/schemas/`,
  and every Monday.

## Running locally

`yarn dev` serves the site on port 3000. Search queries the production Algolia index, so local
edits never appear in it; `.env.example` lists the keys with placeholder values (the real ones
are repository variables and a secret), and without `.env` search says it isn't configured. Page
dates and the sitemap come from git history, so a shallow clone gives wrong dates.

## Compatibility

- **Resource types and CLI:** the framework pages document the resource types
  bluelink-transformer-celerity defines, plus planned ones ahead of it (`celerity/channel`,
  `celerity/workflow`), marked with the versions they arrive in; the CLI pages document the
  Celerity CLI. The docs are often written design-first, ahead of the code.
- **Handler manifest schema:** copied unchanged from celerity-node-sdk's
  `packages/cli/schemas/`, never edited here; `schema-sync.yml` checks it. Its `$id` is
  `https://celerityframework.io/schemas/handler-manifest.v1.schema.json`, so that path never
  moves.
- **URLs:** pages are linked from the transformer's resource definitions (which reach the
  registry and language server docs), its contract docs, and Celerity's and the SDKs' source,
  READMEs and test fixtures. Nothing
  can redirect (static export on GitHub Pages), so moving a page breaks its inbound links
  unless a stub page stays at the old path.
- **Grammar:** `grammars/` is a copy of bluelink-vscode's `syntaxes/blueprintlang.tmLanguage.json`,
  updated by hand when the grammar changes.
- **Persisted state:** none.

## Conventions

- Commits: mostly plain lowercase imperative subjects without a conventional-commit type
  (`update workflow resource type docs ...`); nothing checks them, and there are no releases.
- Language support claims follow `content/docs/framework/versions.mdx`. Interpreted languages
  (Node.js, Python) run in-process in their runtime image; C# has a runtime image providing .NET,
  with its handler running as a separate process over the handler IPC protocol; natively
  compiled languages (Go) run on an OS-only runtime over the same protocol.

## Safety

- **A push to `main` deploys.** `deploy.yml` builds the site, syncs the Algolia index and
  publishes to GitHub Pages at celerityframework.io, and nothing builds a pull request first,
  so run the checks above before a change reaches `main`.
- Don't run `yarn build` or `yarn sync-content` unless asked while Algolia credentials are
  available, whether from `.env`, the shell environment or CI: they overwrite the production
  search index. `.env` doesn't override variables already set in the shell.

## Known mistakes

<!-- One line per mistake an agent has made here, phrased as the rule that prevents it. -->
