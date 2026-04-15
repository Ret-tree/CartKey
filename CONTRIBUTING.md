# Contributing to CartKey

Thank you for your interest in contributing to CartKey! This project is open-source and community-driven.

## Getting Started

```bash
git clone https://github.com/blackatlas/cartkey.git
cd cartkey
npm install
npm run dev
```

The dev server runs at `http://localhost:8080`.

## Development Guidelines

### Code Style
- TypeScript strict mode — no `any` types without justification
- Functional React components with hooks
- Tailwind CSS for all styling — no inline style objects unless dynamic values are required
- Named exports for components, default export only for `App.tsx`

### Commit Messages
Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### Pull Requests
1. Fork the repo and create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure `npx tsc --noEmit` passes with zero errors
4. Ensure `npm run build` succeeds
5. Open a PR against `main` with a clear description

### Testing
- Write tests for new business logic (Vitest)
- Test critical UI flows (React Testing Library)
- E2E tests for checkout and card management flows (Playwright)
- Minimum 80% coverage on new code

## Contribution Areas

### Adding a New Store
Edit `src/data/stores.ts` — add an entry with the store's name, brand color, emoji icon, and approximate coordinates for a well-known location.

### Writing a Coupon Adapter
See `functions/api/coupons.ts` for the data schema. Adapters should normalize external data into CartKey's unified coupon format.

### Store Layout Mapping
Contribute aisle-to-category mappings for your local store to help with shopping list sorting.

### Translations
CartKey uses i18next. Translation files are in `src/i18n/`. Add a new locale JSON file and submit a PR.

## Code of Conduct

Be respectful, constructive, and welcoming. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
