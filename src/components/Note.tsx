import { memo, useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { NOTE_COLORS } from '../domain/note'
import type { Note as NoteModel } from '../domain/note'
import { useNotes } from '../app/notesContext'

export interface NoteDragVisual {
  overTrash: boolean
}

const KEYBOARD_STEP_PX = 8

interface NoteProps {
  note: NoteModel
  dragVisual: NoteDragVisual | null
  autoFocus: boolean
  onStartMove: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
  onStartResize: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
  onNudge: (note: NoteModel, deltaX: number, deltaY: number) => void
  onNudgeResize: (note: NoteModel, deltaWidth: number, deltaHeight: number) => void
  onDelete: (note: NoteModel) => void
}

export const Note = memo(function Note({
  note,
  dragVisual,
  autoFocus,
  onStartMove,
  onStartResize,
  onNudge,
  onNudgeResize,
  onDelete,
}: NoteProps) {
  const { dispatch } = useNotes()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  // Escaping the editor moves focus back to the note, which fires blur; that
  // blur must not save the draft the user just discarded.
  const skipCommitRef = useRef(false)

  useEffect(() => {
    if (autoFocus) {
      rootRef.current?.focus()
    }
  }, [autoFocus])

  const beginEdit = () => {
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
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    const step = steps[event.key]
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

  const className = [
    'note',
    `note--${note.color}`,
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
      aria-label={note.text.trim() === '' ? 'Empty note' : `Note: ${note.text.slice(0, 60)}`}
      onPointerDown={() => dispatch({ type: 'bringToFront', id: note.id })}
      onKeyDown={handleKeyDown}
    >
      <div
        className="note__bar"
        onPointerDown={(event) => onStartMove(note, event)}
      >
        <span className="note__grip" aria-hidden />
        <div className="note__palette" role="radiogroup" aria-label="Note color">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`note__dot note__dot--${color}${
                color === note.color ? ' is-active' : ''
              }`}
              role="radio"
              aria-checked={color === note.color}
              aria-label={`Set note color ${color}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => dispatch({ type: 'setColor', id: note.id, color })}
            />
          ))}
        </div>
      </div>
      {editing ? (
        <textarea
          className="note__editor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleEditorKeyDown}
          onPointerDown={(event) => event.stopPropagation()}
          placeholder="Write something…"
          aria-label="Note text"
          autoFocus
        />
      ) : (
        <div
          className="note__body"
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
        aria-label="Resize note"
        onPointerDown={(event) => {
          event.stopPropagation()
          onStartResize(note, event)
        }}
      />
    </div>
  )
})
