# Design

## Context

Notes are absolutely positioned divs rendered from a reducer (see `build-sticky-notes-board`). The
pointer gestures live in `useDrag` and clamp through pure helpers in `domain/note.ts`. This change adds
a keyboard path that must reuse those rules, not reimplement them.

## Goals / Non-Goals

**Goals:**

- One key map, applied on the note element, that reuses the same clamping and sizing helpers as the
  pointer gestures.
- Focus management that keeps the keyboard user on the note they were acting on.

**Non-Goals:**

- No keyboard-driven note creation at arbitrary coordinates (the toolbar button creates at the next
  free slot; positioning then happens with the arrow keys).
- No roving tabindex or grid-navigation model: Tab walks the notes in stacking order, which is
  sufficient for a board of this size.
- No multi-select.

## Decisions

### 1. The note element itself is the keyboard surface

`role="group"`, `tabIndex={0}` and an `aria-label` derived from the text. A group (not a button) is
honest: the element is a container of controls, not a single action. The label gives screen readers
the note's content without requiring them to enter it.

### 2. One key map, guarded against descendant events

`handleKeyDown` on the note root ignores events whose `target` is not the root, so a focused colour
swatch or the editor keeps its own semantics. Handled keys call `preventDefault()` so arrows do not
scroll the page and Backspace cannot trigger navigation.

### 3. Keyboard mutations reuse the pointer rules

`onNudge` clamps with `clampRectToBounds` against the usable board; `onNudgeResize` uses `clamp` with
the minimum size and the remaining board extent — the same expressions the resize session uses. Delete
goes through `deleteNote`, the function the trash drop calls, so the undo window and focus tracking
apply identically.

### 4. Focus return after editing is guarded

Closing the editor refocuses the note root, which fires the textarea's `blur`. Without a guard that
blur would commit the draft that `Escape` is supposed to discard, so a `skipCommitRef` flag is set
before the focus move and consumed by the next commit attempt.

## Risks / Trade-offs

- 8 px per key press is a fixed step; fine positioning of a 300 px note needs ~40 presses. Accepted for
  this scope; a modifier for 1 px steps is the obvious follow-up.
- `Backspace` deletes the focused note, which can surprise users trained by web forms; it is paired
  with the undo window, and `Delete` is the primary binding.
- Tab order follows stacking order, so raising a note changes tab order; that matches what the user
  sees on screen.
