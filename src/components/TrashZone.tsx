import { forwardRef } from 'react'
import type { Ref } from 'react'

export const TRASH_ZONE_HEIGHT = 72

interface TrashZoneProps {
  active: boolean
  danger: boolean
}

// The strip is pointer-events: none by design — hit testing is computed
// from geometry, not DOM events, so a dragged note never gets intercepted.
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
  return (
    <div ref={ref} className={className} role="region" aria-label="Trash zone">
      <span className="trash__icon" aria-hidden>
        🗑
      </span>
      Drop here to delete
    </div>
  )
})
