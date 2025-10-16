# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Frontend React + TypeScript app built with Vite (SWC plugin) and Tailwind CSS v4. Aliases map "@" to "src".
- Component development via Storybook (react-vite) with addons: Docs, A11y, Onboarding, Vitest, and Chromatic integration.
- Testing strategy centers on Vitest running in a real browser (Playwright provider) against Storybook stories; E2E via Cypress.
- Linting uses ESLint flat config with typescript-eslint, react-hooks, react-refresh, and storybook plugin.
- TypeScript uses project references (tsconfig.app.json, tsconfig.node.json), strict settings, and Vite path aliasing.
- shadcn/ui configured via components.json; Tailwind entrypoint at src/index.css.

Commands
- Install dependencies (uses npm because package-lock.json exists):
  - npm ci
- Local dev server (Vite):
  - npm run dev
- Build app (TypeScript build + Vite bundle) and preview:
  - npm run build
  - npm run preview
- Lint (ESLint flat config):
  - npm run lint
- Storybook (component workshop/docs):
  - npm run storybook
  - npm run build-storybook
- Unit/component tests (Vitest + Storybook + Playwright):
  - Run all: npx vitest
  - Single file: npx vitest path/to/file.test.ts
  - Single test by name: npx vitest -t "test name substring"
  - First-time setup (browsers for Playwright provider): npx playwright install
- E2E tests (Cypress):
  - Open runner: npx cypress open
  - Headless run: npx cypress run
- Type-check only (no emit):
  - npx tsc -b --noEmit

Architecture and key configs
- Vite config (vite.config.ts):
  - Plugins: @vitejs/plugin-react-swc, @tailwindcss/vite
  - resolve.alias: "@" → ./src
  - test: configured with @storybook/addon-vitest’s storybookTest plugin; browser mode enabled (headless Chromium via Playwright), setupFiles: .storybook/vitest.setup.ts
- Storybook (.storybook):
  - main.ts: stories from src/**/*.stories.(ts|tsx|js|jsx|mjs), addons include Docs, A11y, Onboarding, Vitest, Chromatic; framework is @storybook/react-vite
  - preview.ts: enables controls matchers; a11y parameter test: 'todo' (surface violations in UI, do not fail CI)
  - vitest.setup.ts: applies project annotations including A11y to Storybook/Vitest tests
- ESLint (eslint.config.js): flat config; extends @eslint/js recommended, typescript-eslint recommended, react-hooks recommended-latest, react-refresh vite
- TypeScript (tsconfig.json + refs):
  - Root tsconfig references tsconfig.app.json (browser) and tsconfig.node.json (Node-side tooling); strict mode, bundler moduleResolution, noEmit, path alias
- Cypress (cypress.config.ts): standard e2e skeleton with support files in cypress/support
- UI system: Tailwind v4 via @tailwindcss/vite; shadcn/ui aliases in components.json (components/ui, lib, hooks, etc.)

Notes from README.md
- README shows how to expand ESLint to type-aware rules using typescript-eslint’s recommendedTypeChecked/strictTypeChecked and adds React-specific plugins; consult README if you need stricter linting.
