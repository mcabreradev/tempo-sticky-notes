# Proposal

## Why

The browser suite currently finds elements by their BEM class names and asserts interaction state
through those same classes (`note--dragging`, `trash--danger`, `note--green`). That couples a black-box
suite to the styling layer: renaming a class for CSS reasons breaks tests that care about behaviour, and
a test failure no longer tells you whether the product or the stylesheet changed.

## What Changes

- Add `data-testid` hooks to the elements the suite identifies (board, note, note parts, trash strip,
  toolbar controls, undo toast, preview).
- Expose the interaction state the suite asserts as `data-*` attributes instead of class names:
  `data-color` on a note, `data-dragging` / `data-over-trash` while a gesture runs, and
  `data-state` (`idle` / `armed` / `danger`) on the trash strip.
- Rewrite the Playwright selectors and assertions to use those hooks; keep `getByRole` where the query
  is genuinely about an accessible name (buttons, the colour radiogroup).
- Leave the colocated component tests as they are: they are white-box and legitimately assert the
  classes the component renders.

No product behaviour changes, so the change sets `skip_specs: true`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — no requirement changes)

## Impact

- **Code**: `components/Note.tsx`, `components/Board.tsx`, `components/TrashZone.tsx`,
  `components/Toolbar.tsx` (attributes only), `e2e/support.ts` and the three specs, README.
- **Tests**: the unit suite keeps asserting classes; the browser suite stops depending on them.
- **Dependencies**: none.
