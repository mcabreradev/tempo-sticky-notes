# Tasks

## 1. Focusable notes

- [x] 1.1 Make the note element focusable with a group role and a text-derived accessible name — verified: "exposes every note as a focusable element in the tab order" test green
- [x] 1.2 Show a visible focus ring on the focused note and on every interactive control — verified: computed `outline` read from the focused note in Chrome, screenshot reviewed

## 2. Keyboard operations

- [x] 2.1 Arrow keys move the focused note by 8 px with board clamping — verified: two UI tests (movement, clamping at edges)
- [x] 2.2 Shift+arrow keys resize the focused note by 8 px with minimum-size clamping — verified: "resizes the focused note with Shift+Arrow" test
- [x] 2.3 Delete/Backspace deletes through the same path as the trash drop (undo offer included) — verified: "deletes the focused note with Delete and offers undo" test
- [x] 2.4 Enter/F2 opens the editor; Escape closes it, discards the draft and returns focus to the note — verified: "starts editing with Enter and returns with Escape" test + Firefox keyboard run

## 3. Focus management

- [x] 3.1 Creating from the toolbar focuses the new note; undo focuses the restored note — verified: "moves the new note into focus after creating it from the toolbar" test and Firefox run
- [x] 3.2 Guard the editor's blur so Escape cannot commit the discarded draft — verified: "reverts the text when Escape is pressed while editing" test still green

## 4. Verification and documentation

- [x] 4.1 Full gate on the worktree: lint, type-check, tests, build — verified: eslint 0, `tsc -b` 0, 88/88 tests, build OK
- [x] 4.2 Keyboard verification in a real browser at 1024×768 — verified: Firefox/Playwright run (focus after create, arrows 64→80/64→72, Shift+arrows 240×160→248×168, Enter/Escape editing, Cmd+Enter save, Delete + undo with focus, Tab reaching the palette)
- [x] 4.3 Document the keyboard map and the run in the README — verified: README "Keyboard" section, verification entry, limitations updated

## Verification record

- Firefox keyboard run: creation focuses the note (`role=group`, `tabindex=0`); arrows move by 8 px;
  Shift+arrows resize by 8 px; Enter opens the editor and Escape discards the draft and returns focus;
  Cmd+Enter saves; Delete removes the note and undo restores it with focus; Tab from a note reaches its
  colour swatches.
- Not verified: Microsoft Edge, touch input, non-macOS platforms.
