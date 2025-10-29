# Todo React App Roadmap

## Phase 0 – Foundations
- Initialize Vite + React project structure with local development scripts.
- Configure ESLint + Prettier defaults; add `.gitignore` and basic README.
- Implement `useTodos` hook backed by `localStorage` for persistence.

## Phase 1 – Core Todo Experience
- Build todo list UI with add, toggle complete, and delete interactions.
- Support inline editing and completion timestamps in state.
- Add persistence syncing (hydrate from storage on load, write on change).
- Cover key behavior with React Testing Library + Vitest.

## Phase 2 – UX & Accessibility
- Introduce filtering (all / active / completed) and search.
- Add simple prioritization and due date metadata.
- Improve keyboard navigation, ARIA roles, focus management, and responsive layout.

## Phase 3 – Optional Cloud Sync
- Optionally integrate a lightweight backend (Supabase/Firebase or custom API).
- Add user sign-in and sync local todos to remote store with conflict handling.
- Provide import/export and data reset utilities for users.
