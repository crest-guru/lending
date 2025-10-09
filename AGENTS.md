# Repository Guidelines

## Project Structure & Module Organization
Source React + TypeScript code lives in `src/`, with `App.tsx` driving the landing page and `api.ts` handling client calls to the Notion bridge. Cloudflare Pages functions sit in `functions/api`; `submit-form.js` receives form data, enriches it with request metadata, and forwards submissions to Notion. Static assets belong in `public/` (served verbatim by Vite), while production bundles are emitted to `dist/` after a build. Keep long-lived configuration in the root configs (Vite, Tailwind, ESLint) so new agents inherit shared behavior.

## Build, Test, and Development Commands
Run `npm install` once per environment. `npm run dev` launches the Vite dev server for the React app; add `npm run dev:functions` when you need the Cloudflare function locally, or use `npm run dev:local` to start both together (requires the global `wrangler` CLI). `npm run build` produces a production bundle, and `npm run preview` serves that output for smoke checks. `npm run lint` runs ESLint across the repo and should stay green before every commit.

## Coding Style & Naming Conventions
Favor functional React components and TypeScript types/interfaces near their usage. Indent with two spaces, prefer single quotes, and keep JSX attributes ordered for readability. Follow Tailwind utility conventions already present in `App.tsx`, grouping layout → color → animation classes. ESLint (see `eslint.config.js`) enforces the React Hooks and refresh rules—resolve warnings immediately rather than suppressing them.

## Testing Guidelines
Automated tests are not yet configured; when adding them, colocate Vitest or React Testing Library specs as `*.test.tsx` beside the component, and gate new features behind those tests. Until then, manual QA should cover form validation, Notion submission, and error paths (`betaAgreed`, `privacyAgreed`, abort scenarios). Document any reproduction steps in the PR so reviewers can repeat them quickly.

## Commit & Pull Request Guidelines
Recent commits are terse and lowercase; move toward short imperative subjects ("Add hero animation state"), optionally followed by a blank line and detail. Reference related issues or Linear tickets in the body when applicable. PRs should call out UI changes with before/after screenshots, list affected routes or functions (`functions/api/submit-form.js`), and describe how you validated the change (commands run, manual steps, screenshots).

## Configuration & Security Notes
Set `NOTION_API`/`NOTION_TOKEN` and `NOTION_DB` in the Pages environment before deploying functions; missing values cause 500 responses. For local API testing, export `VITE_API_BASE` to point the front end at a staging function URL. Do not commit secrets or `.env` files—share them through the team vault instead.
