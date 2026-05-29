import { useEffect, type ReactNode } from 'react'

export const Modal = ({
  isOpen,
  title,
  onClose,
  onBack,
  backLabel,
  headerActions,
  children
}: {
  isOpen: boolean
  title?: string
  onClose: () => void
  onBack?: () => void
  backLabel?: string
  headerActions?: ReactNode
  children: ReactNode
}) => {
  const titleId = title ? `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="tt-modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="tt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : 'Dialog'}
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="tt-modal-header">
          <div className="tt-modal-left">
            {onBack && (
              <button
                type="button"
                className="tt-modal-back"
                onClick={onBack}
                aria-label={backLabel ?? 'Back'}
                title={backLabel ?? 'Back'}
              >
                ←
              </button>
            )}
          </div>

          <div id={titleId} className="tt-modal-title">{title}</div>

          <div className="tt-modal-right">
            {headerActions}
            <button type="button" className="tt-modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <div className="tt-modal-body">{children}</div>
      </div>
    </div>
  )
}
