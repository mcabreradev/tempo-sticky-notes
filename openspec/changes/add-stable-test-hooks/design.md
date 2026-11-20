# Design

## Context

`e2e/` drives the built app as a black box. Its current selectors are the BEM classes the stylesheet
uses, which means a CSS rename is a test breakage, and an assertion like `toHaveClass(/note--danger/)`
conflates "the note is over the trash" with "the class that paints it is called that".

## Goals / Non-Goals

**Goals:**

- One selector contract for the browser suite: `data-testid` for identity, `data-*` for state.
- Keep the accessible-name queries where they double as accessibility checks.

**Non-Goals:**

- No change to the classes used for styling: they stay the styling layer's business.
- No test-ID library or selector constants file; `getByTestId` reads well enough.
- No rewriting of the colocated component tests, which are white-box by design.

## Decisions

### 1. Testid for identity, data attributes for state

`data-testid` answers "which element is this" (`note`, `note-body`, `note-editor`, `note-resize`,
`trash`, `board`, `board-preview`, `sync-status`, `undo-toast`). State that the suite asserts moves to
attributes that are not styling concerns: `data-color`, `data-dragging`, `data-over-trash`, and
`data-state` on the trash strip. The attributes are derived from the same values the components already
compute, so there is no second source of truth.

### 2. Role queries stay where they check accessibility

`getByRole('button', { name: '+ New note' })`, the colour radiogroup and the Undo button remain
role-based: those queries assert the accessible name, which is a requirement in its own right (the
keyboard suite depends on it). Swapping them for testids would weaken the test.

### 3. Component tests keep their class assertions

A colocated test asserting `note--dragging` is testing the component's own output, not the visual layer
of a deployed page. Keeping it avoids churn and leaves the two suites with the right level of coupling.

## Risks / Trade-offs

- Two vocabularies exist (classes for CSS, data attributes for tests). They are orthogonal on purpose:
  renaming either one cannot break the other.
- `data-testid` in production markup is a few bytes per element; negligible for a board of tens of notes.
