import { useEffect, type ReactNode } from 'react'

export const Modal = (props: {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}) => {
  useEffect(() => {
    if (!props.isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [props.isOpen, props.onClose])

  if (!props.isOpen) return null

  return (
    <div className="tt-modal-overlay" role="presentation" onMouseDown={props.onClose}>
      <div
        className="tt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={props.title ?? 'Dialog'}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="tt-modal-header">
          <div className="tt-modal-title">{props.title}</div>
          <button type="button" className="tt-modal-close" onClick={props.onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="tt-modal-body">{props.children}</div>
      </div>
    </div>
  )
}

