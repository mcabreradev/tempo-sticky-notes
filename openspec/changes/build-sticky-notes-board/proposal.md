# Proposal

## Why

This project is the codebase for a front-end take-home assessment ("Hiring – Front-end developer: Sticky notes TS"). The repository currently contains only the stock Vite + React + TypeScript template, with no application code. We need to turn it into a single-page sticky notes application that demonstrates architecture, performance, code quality, static typing accuracy, and usability.

## What Changes

- Replace the template UI with a desktop sticky notes board (single page, minimum 1024×768).
- Implement all four core features from the assessment (the assessment requires at least three; we implement all four):
  - Create a new note at a specified position and with a specified size (drag-to-create on the empty board, plus a click/button fallback).
  - Change a note's size by dragging (resize handle with pointer capture).
  - Move a note by dragging (pointer capture, cancelable with Escape).
  - Remove a note by dragging it over a predefined trash zone (highlighted on hover, deleted on drop).
- Implement optional features in the client's stated preference order:
  - I. Entering/editing note text (double-click to edit).
  - II. Moving notes to front on overlap (z-order on interaction).
  - III. Saving/restoring notes via `localStorage`.
  - IV. Different note colors (palette).
  - V. Saving notes to a REST API (asynchronous mock, per assessment).
- Add OpenSpec planning artifacts (this change) and proportionate automated tests (Vitest + Testing Library, dev-only dependencies).
- Replace the template README with real submission documentation (English), including a 2–3 paragraph architecture description as requested by the assessment.

Deviation from the caller brief (documented decision): the brief lists pnpm, but the scaffold was already bootstrapped with **bun** (`bun.lock` present) and bun is the standing tooling for this environment. We keep bun and document it; the scripts are package-manager agnostic.

### Explicitly out of scope

- Backend implementation (the assessment allows an async mock).
- Full keyboard-driven note manipulation (keyboard support is limited to shortcuts like Escape/Cmd-Enter inside notes; arrow-key note movement is not implemented in the time budget).
- Undo/redo.

## Capabilities

### New Capabilities

- `note-creation`: Creating notes on the board at a user-specified position and size.
- `note-manipulation`: Moving and resizing existing notes by dragging, including z-order (bring-to-front) behavior for overlapping notes.
- `note-deletion`: Removing notes by dragging them over a predefined trash zone.
- `note-content`: Editing note text and choosing note colors (optional features I and IV).
- `note-persistence`: Restoring/saving notes via localStorage and syncing with an asynchronous REST API mock (optional features III and V).

### Modified Capabilities

(none — greenfield project)

## Impact

- **Code**: full replacement of `src/App.tsx` / CSS template content; new `src/` structure (components, hooks, domain, infra, tests).
- **Dependencies (dev only)**: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`. No new runtime dependencies (assessment asks to avoid readymade solutions).
- **Config**: enable TypeScript `strict` (brief requires strict settings; template ships without it); add Vitest configuration; keep the existing ESLint flat config.
- **Docs**: README rewritten in English for submission; OpenSpec artifacts added under `openspec/`.
- **Tooling**: bun for all JS/TS commands (see deviation above).
