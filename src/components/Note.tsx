import { memo, useState } from 'react'
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

interface NoteProps {
  note: NoteModel
  dragVisual: NoteDragVisual | null
  onStartMove: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
  onStartResize: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
}

export const Note = memo(function Note({
  note,
  dragVisual,
  onStartMove,
  onStartResize,
}: NoteProps) {
  const { dispatch } = useNotes()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const beginEdit = () => {
    setDraft(note.text)
    setEditing(true)
  }
  const commitEdit = () => {
    dispatch({ type: 'setText', id: note.id, text: draft })
    setEditing(false)
  }
  const cancelEdit = () => {
    setEditing(false)
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
      className={className}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
      onPointerDown={() => dispatch({ type: 'bringToFront', id: note.id })}
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
