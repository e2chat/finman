# CRUSH.md

Repo: Nuxt 4 + Vue 3 + Tailwind css 4 + TypeScript minimal starter. No lint/test setup present by default.

Commands
- Install: bun i 
- Dev: bun run dev
- Build: bun run build
- Generate (SSG): bun run generate
- Preview prod: bun run preview
- Typecheck: npx vue-tsc --noEmit (Nuxt generates .nuxt tsconfigs)
- Lint: npx eslint . --ext .ts,.tsx,.vue --fix (add eslint if not installed)
- Tests: none configured. Suggest vitest + @vue/test-utils.
- Run single test (after vitest setup): npx vitest run path/to/file.test.ts

Project conventions
- Module type: ESM ("type": "module"). Prefer named exports; default exports for components/pages.
- Imports: use absolute aliases provided by Nuxt (e.g. #app, #imports, #components) and relative for local files; group: node > alias > relative; no extraneous file extensions.
- Formatting: Prettier defaults (2 spaces, semicolons, single quotes ok). Keep <script setup lang="ts"> in .vue files.
- Types: enable strict typing; use defineProps/defineEmits with typed interfaces; avoid any; use unknown for unsafe inputs; prefer explicit return types in utils.
- Naming: components PascalCase, composables useXxx (in composables/), utils camelCase, constants UPPER_SNAKE, files kebab-case.vue.
- State/composables: prefer useState/useFetch/useAsyncData; server routes under server/api; keep side effects in onMounted/server handlers.
- Error handling: use try/catch around async calls; surface user messages via useToast or UI layer; throw createError in server handlers; never leak secrets.
- Env: use runtimeConfig for secrets; do not commit .env; provide .env.example only.
- Routing: file-based under pages/; use <NuxtLink> and useRouter/useRoute.
- Accessibility: prefer <NuxtLink> for nav, add aria-labels, keyboard focus states.

AI/assistant rules
- No Cursor/Copilot rules found.
- Add project-specific commands here as they’re introduced.
