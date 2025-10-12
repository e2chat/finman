# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Finman** is a personal finance tracker built with Nuxt 4, Vue 3, TypeScript, and Tailwind CSS 4. It manages finance items (self loans, loans to others, savings boxes) with progress tracking. Data persists in browser localStorage.

## Tech Stack

- **Runtime**: Bun (preferred package manager)
- **Framework**: Nuxt 4 (with Nuxt 4 directory structure: `app/` instead of root-level pages/components)
- **UI**: Vue 3 (Composition API with `<script setup>`)
- **Styling**: Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin)
- **Module Type**: ESM only

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Start dev server (http://localhost:3000)
bun run build            # Build for production
bun run generate         # Generate static site (SSG)
bun run preview          # Preview production build locally
npx vue-tsc --noEmit     # Run TypeScript type checking
```

## Project Structure

```
app/
  pages/              # File-based routing
    index.vue         # Main dashboard: searchable list of finance items
    add.vue           # Create new finance item form
    item/[id].vue     # Detail/edit view for a single finance item
  composables/
    useFinanceStore.ts  # Global state management for finance items
  assets/css/         # Tailwind CSS entry point
```

### Key Architecture Patterns

**State Management**: Uses `useState` from Nuxt (not Pinia/Vuex). The `useFinanceStore` composable:
- Exposes reactive `items` array (type `FinanceItem[]`)
- Methods: `load()`, `persist()`, `upsert()`, `remove()`, `getById()`
- Data stored in `localStorage` under key `finman.items.v1`
- Loads on `onMounted` (client-only)

**Data Model** (`FinanceItem`):
```ts
{
  id: string             // UUID generated via custom uuid() function
  type: 'loan_self' | 'loan_other' | 'savings'
  name: string
  targetAmount: number   // Goal or principal
  currentAmount: number  // Amount paid/deposited
  createdAt: number      // Epoch timestamp (ms)
  updatedAt: number      // Epoch timestamp (ms)
}
```

**Routing**: File-based via Nuxt. Use `<NuxtLink>` or `useRouter().push()` for navigation.

**Aliases**: Nuxt 4 uses `app/` directory. Config sets `@` and `~` to resolve to `./app`. Use `#app`, `#imports`, `#components` for Nuxt auto-imports.

## Coding Conventions (from CRUSH.md)

- **Imports**: Group as node modules > aliases > relative paths. No extraneous extensions.
- **Formatting**: 2 spaces, semicolons optional, single quotes OK.
- **Types**: Strict typing enabled. Use `defineProps`/`defineEmits` with typed interfaces. Avoid `any`. Prefer explicit return types in utils.
- **Naming**:
  - Components: PascalCase
  - Composables: `useXxx` (in `app/composables/`)
  - Utils: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case.vue
- **State/Composables**: Prefer `useState`, `useFetch`, `useAsyncData`. Keep side effects in `onMounted` or server handlers.
- **Error Handling**: Use try/catch around async calls. Surface user messages via UI. Use `throw createError()` in server handlers. Never leak secrets.
- **Environment**: Use `runtimeConfig` for secrets. Do not commit `.env`.
- **Accessibility**: Use `<NuxtLink>` for navigation, add `aria-labels`, ensure keyboard focus states.

## Development Notes

- **No Linting/Testing Configured**: Add ESLint or Vitest if needed.
- **SSR/SSG**: This app uses client-side localStorage; server-side rendering will show empty state until mounted.
- **Tailwind v4**: Uses Vite plugin. Configuration is in `nuxt.config.ts` under `vite.plugins`.
- never start the dev server