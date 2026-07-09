import { NOTES } from '../data/notes'
import { useLanguage } from '../i18n/LanguageContext'

export default function NoteSelector({ activeSlot, onSlotChange, onNoteClick, onSkip, onClear, onBottomUpToggle, selectedCell, columns }) {
  const { t } = useLanguage()

  const cell = selectedCell ? columns[selectedCell.col]?.cells[selectedCell.row] : null
  const hasNote1 = !!cell?.note1
  const hasNote2 = !!cell?.note2
  const isBottomUp = activeSlot === 'note1' ? !!cell?.bottomUp1 : !!cell?.bottomUp2
  const canToggleBottomUp = activeSlot === 'note1' ? hasNote1 : hasNote2

  return (
    <div className="note-selector">
      <div className="slot-toggle">
        <button
          className={`slot-btn slot-btn-accent ${isBottomUp ? 'active' : ''}`}
          onClick={onBottomUpToggle}
          disabled={!canToggleBottomUp}
          title={t('bottomUpStroke')}
        >
          ¬
        </button>
      </div>
      <div className="slot-toggle">
        <button
          className={`slot-btn ${activeSlot === 'note1' ? 'active' : ''}`}
          onClick={() => onSlotChange('note1')}
        >
          {t('firstNote')}
        </button>
        <button
          className={`slot-btn ${activeSlot === 'note2' ? 'active' : ''}`}
          onClick={() => onSlotChange('note2')}
          disabled={!hasNote1}
          title={!hasNote1 ? t('selectCellFirst') : t('halfTimeHint')}
        >
          {t('secondNote')} <span className="slot-hint">({t('halfTime')})</span>
        </button>
      </div>

      <div className="note-palette">
        {NOTES.map(({ char, reading }) => (
          <button
            key={char}
            className={`note-btn${char.length > 1 ? ' note-btn-multi' : ''}`}
            onClick={() => onNoteClick(char)}
            disabled={!selectedCell}
            title={reading}
          >
            {char}
          </button>
        ))}
      </div>

      <button
        className="note-btn note-btn-blank"
        onClick={onSkip}
        disabled={!selectedCell}
        title="Skip cell"
      >
        ↓
      </button>

      <div className="selector-actions">
        {selectedCell ? (
          <span className="cell-info">
            {t('col')} {selectedCell.col + 1}, {t('row')} {selectedCell.row + 1}
            {hasNote1 && <> · <strong>{columns[selectedCell.col].cells[selectedCell.row].note1}</strong></>}
            {hasNote2 && <> + <strong>{columns[selectedCell.col].cells[selectedCell.row].note2}</strong></>}
          </span>
        ) : (
          <span className="cell-info muted">{t('clickToSelect')}</span>
        )}
        <button
          className="btn-clear"
          onClick={onClear}
          disabled={!selectedCell}
        >
          {t('clearCell')}
        </button>
      </div>
    </div>
  )
}
