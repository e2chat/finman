# Repository Guidelines

## Project Structure & Module Organization
- Core config files (`package.json`, `nuxt.config.ts`, `tsconfig.json`, `bun.lock`) sit at the repo root; install dependencies with `npm install`.
- The Nuxt app lives under `app/`: `pages/` drives routes (kebab-case filenames), `components/` exports PascalCase widgets, `composables/` holds reusable stores/hooks, and `assets/` contains styles/images. `app.vue` wraps the layout and `public/` hosts static payloads.
- Favor relative imports inside `app/` (e.g., `../composables/useFinanceStore`) so tooling stays deterministic.

## Build, Test, and Development Commands
- `npm run dev`: launches Nuxt with HMR for local feature work and layout tweaks.
- `npm run build`: compiles the TypeScript/Vite bundle for production and reports compile failures.
- `npm run generate`: produces a static export when targeting CDN-like hosts.
- `npm run preview`: serves a production build locally so you can sanity-check the generated artifacts.
- Rerun `npm install` after changing dependencies before invoking these commands.

## Coding Style & Naming Conventions
- All `.vue` files use `<script setup lang="ts">`, 2-space indentation, and explicit typing for composable returns; keep script logic lean and push UI behavior into composables/custom hooks.
- Templates rely on Tailwind utility classes; group layout/spacing classes together, avoid inline styles, and document unusual utility combos with short comments.
- Name composables as `useXxx`, components in PascalCase, and pages in lowercase/kebab to match Nuxt’s resolver.

## Testing Guidelines
- No automated suite exists yet—validate work by running `npm run dev`/`preview` and exercising the UI flows (add item, edit, export/import).
- If you add tests later, place them under `tests/` (create the directory) and follow matching names, e.g., `tests/unit/pages-index.spec.ts`; note the command to run in the PR notes.

## Commit & Pull Request Guidelines
- Keep using conventional commits (`feat:`, `fix:`, `refactor:`) so history stays consistent and change logs can be inferred.
- PRs need a short summary, linked issue/ticket when applicable, and mention of manual verification steps (e.g., “Ran `npm run build` and inspected the home page”).
- Add screenshots only when interfaces changed visibly; otherwise rely on a clear textual walkthrough.

## Deployment & Configuration Tips
- Deploy static builds from `npm run generate` output (e.g., copy `dist/` to the host) and verify with `npm run preview` beforehand.
- Keep secrets outside the repo and reference them via Nuxt’s env loading; never commit API keys or private credentials.
