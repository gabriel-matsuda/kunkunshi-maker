import { useState } from 'react'

export default function SheetCell({ cell, isSelected, note2Active, onClick, onNote2Click, onChorusToggle, onContextMenu, onInsertCell, onRemoveCell }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`sheet-cell ${isSelected && !note2Active ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Insert cell button — top center, appears on hover */}
      <button
        className="cell-action-btn cell-action-insert"
        onMouseDown={e => { e.stopPropagation(); onInsertCell() }}
        title="Insert cell"
        tabIndex={-1}
      >＋</button>

      {/* Chorus start marker — right side top */}
      <button
        className={`chorus-marker chorus-start ${cell.chorusStart ? 'on' : ''} ${hovered || cell.chorusStart ? 'visible' : ''}`}
        onClick={e => { e.stopPropagation(); onChorusToggle('chorusStart') }}
        title="Toggle chorus start"
        tabIndex={-1}
      >↑</button>

      <div className="cell-notes">
        {cell.note1 ? (
          <span className={`note1${cell.note1.length > 1 ? ' note-multi' : ''}${cell.bottomUp1 ? ' note-bottom-up' : ''}`}>{cell.note1}</span>
        ) : (
          <span className="note-empty" />
        )}
      </div>

      {/* Half-time note — sits on the bottom border line, clickable to select it */}
      {cell.note2 && (
        <span
          className={`note2 ${note2Active ? 'note2-selected' : ''}${cell.note2.length > 1 ? ' note-multi' : ''}${cell.bottomUp2 ? ' note-bottom-up' : ''}`}
          onClick={onNote2Click}
        >
          {cell.note2}
        </span>
      )}

      {/* Chorus end marker — right side bottom */}
      <button
        className={`chorus-marker chorus-end ${cell.chorusEnd ? 'on' : ''} ${hovered || cell.chorusEnd ? 'visible' : ''}`}
        onClick={e => { e.stopPropagation(); onChorusToggle('chorusEnd') }}
        title="Toggle chorus end"
        tabIndex={-1}
      >↓</button>

      {/* Remove cell button — bottom center, appears on hover */}
      <button
        className="cell-action-btn cell-action-remove"
        onMouseDown={e => { e.stopPropagation(); onRemoveCell() }}
        title="Remove cell"
        tabIndex={-1}
      >－</button>
    </div>
  )
}
