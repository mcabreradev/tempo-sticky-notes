import { forwardRef } from 'react'
import type { Ref } from 'react'

interface TrashZoneProps {
  active: boolean
  danger: boolean
}

// The strip is pointer-events: none by design — hit testing is computed
// from geometry, not DOM events, so a dragged note never gets intercepted.
// Its height lives in the stylesheet only: the board measures this element
// instead of duplicating the number in TypeScript.
export const TrashZone = forwardRef(function TrashZone(
  { active, danger }: TrashZoneProps,
  ref: Ref<HTMLDivElement>,
) {
  const className = [
    'trash',
    active ? 'trash--active' : '',
    danger ? 'trash--danger' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const state = danger ? 'danger' : active ? 'armed' : 'idle'
  return (
    <div
      ref={ref}
      className={className}
      role="region"
      aria-label="Trash zone"
      data-testid="trash"
      data-state={state}
    >
      <span className="trash__icon" aria-hidden>
        🗑
      </span>
      Drop here to delete
    </div>
  )
})
