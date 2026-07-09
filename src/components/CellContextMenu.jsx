import { useEffect, useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export default function CellContextMenu({ x, y, onInsert, onRemove, onClose }) {
  const { t } = useLanguage()
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="cell-context-menu"
      style={{ top: y, left: x }}
    >
      <button className="context-menu-item" onClick={onInsert}>
        <span className="context-menu-icon">＋</span>
        {t('insertCell')}
      </button>
      <button className="context-menu-item context-menu-item-danger" onClick={onRemove}>
        <span className="context-menu-icon">－</span>
        {t('removeCell')}
      </button>
    </div>
  )
}
