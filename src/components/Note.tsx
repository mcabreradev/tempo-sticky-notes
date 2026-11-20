import { memo, useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { NOTE_COLORS } from '../domain/note'
import type { NoteColor, Note as NoteModel } from '../domain/note'
import { useBoardDispatch } from '../app/notesContext'

export interface NoteDragVisual {
  overTrash: boolean
}

const KEYBOARD_STEP_PX = 8

// The domain owns the palette; the stylesheet owns the class names. These maps
// are the seam between them: renaming a colour in the domain cannot silently
// orphan a rule, and the stylesheet test asserts every entry here has styling.
const COLOR_CLASS: Record<NoteColor, string> = {
  yellow: 'note--yellow',
  green: 'note--green',
  blue: 'note--blue',
  pink: 'note--pink',
  purple: 'note--purple',
  orange: 'note--orange',
}

const DOT_CLASS: Record<NoteColor, string> = {
  yellow: 'note__dot--yellow',
  green: 'note__dot--green',
  blue: 'note__dot--blue',
  pink: 'note__dot--pink',
  purple: 'note__dot--purple',
  orange: 'note__dot--orange',
}

const KEY_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex --
   The note is a composite widget: it is focusable as a whole (arrows move it,
   Enter/F2 edit, Delete removes) while its children are the controls it owns.
   role="button" would nest interactive content and flatten those controls, and
   a pure structure role cannot describe the keyboard model, so the group is
   focusable on purpose. */

interface NoteProps {
  note: NoteModel
  dragVisual: NoteDragVisual | null
  focusOnMount: boolean
  onFocusHandled: () => void
  onStartMove: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
  onStartResize: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
  onNudge: (note: NoteModel, deltaX: number, deltaY: number) => void
  onNudgeResize: (note: NoteModel, deltaWidth: number, deltaHeight: number) => void
  onDelete: (note: NoteModel) => void
}

export const Note = memo(function Note({
  note,
  dragVisual,
  focusOnMount,
  onFocusHandled,
  onStartMove,
  onStartResize,
  onNudge,
  onNudgeResize,
  onDelete,
}: NoteProps) {
  // Only the dispatch context: its value never changes, so a state update
  // elsewhere on the board does not re-render this note.
  const dispatch = useBoardDispatch()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([])
  // Escaping the editor moves focus back to the note, which fires blur; that
  // blur must not save the draft the user just discarded. Reset on every edit
  // so a blur that never arrives cannot disable saving for good.
  const skipCommitRef = useRef(false)

  useEffect(() => {
    if (focusOnMount) {
      rootRef.current?.focus()
      onFocusHandled()
    }
  }, [focusOnMount, onFocusHandled])

  // Focus the editor when it opens. An effect instead of the autoFocus
  // attribute: the focus is a consequence of the user's action (Enter, F2,
  // double-click), not of the element happening to mount.
  useEffect(() => {
    if (editing) {
      editorRef.current?.focus()
    }
  }, [editing])

  const beginEdit = () => {
    skipCommitRef.current = false
    setDraft(note.text)
    setEditing(true)
  }
  const commitEdit = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false
      return
    }
    dispatch({ type: 'setText', id: note.id, text: draft })
    setEditing(false)
    rootRef.current?.focus()
  }
  const cancelEdit = () => {
    skipCommitRef.current = true
    setEditing(false)
    rootRef.current?.focus()
  }

  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      commitEdit()
    }
  }

  // Keyboard parity for the pointer gestures: arrows move, Shift+arrows resize,
  // Delete removes (with the same undo offer), Enter edits.
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return
    }
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault()
      beginEdit()
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      onDelete(note)
      return
    }
    const step = KEY_STEPS[event.key]
    if (!step) {
      return
    }
    event.preventDefault()
    const [unitX, unitY] = step
    if (event.shiftKey) {
      onNudgeResize(note, unitX * KEYBOARD_STEP_PX, unitY * KEYBOARD_STEP_PX)
    } else {
      onNudge(note, unitX * KEYBOARD_STEP_PX, unitY * KEYBOARD_STEP_PX)
    }
  }

  // Radiogroup semantics: one tab stop, arrows move the selection.
  const handleSwatchKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const forwards = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backwards = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forwards && !backwards) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const nextIndex =
      (index + (forwards ? 1 : -1) + NOTE_COLORS.length) % NOTE_COLORS.length
    const nextColor = NOTE_COLORS[nextIndex]
    if (!nextColor) {
      return
    }
    dispatch({ type: 'setColor', id: note.id, color: nextColor })
    dotRefs.current[nextIndex]?.focus()
  }

  const className = [
    'note',
    COLOR_CLASS[note.color],
    dragVisual ? 'note--dragging' : '',
    dragVisual?.overTrash ? 'note--danger' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
      role="group"
      tabIndex={0}
      data-testid="note"
      data-color={note.color}
      data-dragging={dragVisual ? 'true' : undefined}
      data-over-trash={dragVisual?.overTrash ? 'true' : undefined}
      aria-roledescription="sticky note"
      aria-keyshortcuts="Enter F2 Delete Backspace ArrowUp ArrowDown ArrowLeft ArrowRight"
      aria-label={
        note.text.trim() === '' ? 'Empty note' : `Note: ${note.text.slice(0, 60)}`
      }
      // Capture phase: raising happens before any child can stop propagation,
      // so recolouring or resizing raises the note just like pressing its body.
      onPointerDownCapture={(event) => {
        if (event.button !== 0) {
          return
        }
        dispatch({ type: 'bringToFront', id: note.id })
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="note__bar"
        data-testid="note-bar"
        onPointerDown={(event) => onStartMove(note, event)}
      >
        <span className="note__grip" aria-hidden />
        <div className="note__palette" role="radiogroup" aria-label="Note color">
          {NOTE_COLORS.map((color, index) => (
            <button
              key={color}
              ref={(element) => {
                dotRefs.current[index] = element
              }}
              type="button"
              className={`note__dot ${DOT_CLASS[color]}${
                color === note.color ? ' is-active' : ''
              }`}
              role="radio"
              aria-checked={color === note.color}
              aria-label={`Set note color ${color}`}
              data-testid={`note-color-${color}`}
              tabIndex={color === note.color ? 0 : -1}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => handleSwatchKeyDown(event, index)}
              onClick={() => dispatch({ type: 'setColor', id: note.id, color })}
            />
          ))}
        </div>
      </div>
      {editing ? (
        <textarea
          ref={editorRef}
          className="note__editor"
          data-testid="note-editor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleEditorKeyDown}
          onPointerDown={(event) => event.stopPropagation()}
          placeholder="Write something…"
          aria-label="Note text"
        />
      ) : (
        <div
          className="note__body"
          data-testid="note-body"
          onPointerDown={(event) => onStartMove(note, event)}
          onDoubleClick={beginEdit}
        >
          {note.text === '' ? (
            <span className="note__placeholder">Double-click to write…</span>
          ) : (
            note.text
          )}
        </div>
      )}
      <button
        type="button"
        className="note__resize"
        data-testid="note-resize"
        aria-label="Resize note"
        onPointerDown={(event) => {
          event.stopPropagation()
          onStartResize(note, event)
        }}
      />
    </div>
  )
})
