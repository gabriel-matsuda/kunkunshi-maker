import SheetCell from './SheetCell'

export default function SheetColumn({ colIndex, column, selectedCell, activeSlot, onCellSelect, onNote2Select, onLyricChange, onChorusToggle, onCellContextMenu, onInsertCell, onRemoveCell }) {
  return (
    <div className="sheet-column-group">
      {/* Notation column */}
      <div className="notation-col">
        {column.cells.map((cell, rowIndex) => (
          <SheetCell
            key={rowIndex}
            colIndex={colIndex}
            rowIndex={rowIndex}
            cell={cell}
            isSelected={selectedCell?.col === colIndex && selectedCell?.row === rowIndex}
            note2Active={selectedCell?.col === colIndex && selectedCell?.row === rowIndex && activeSlot === 'note2'}
            onClick={() => onCellSelect(colIndex, rowIndex)}
            onNote2Click={e => { e.stopPropagation(); onNote2Select(colIndex, rowIndex) }}
            onChorusToggle={marker => onChorusToggle(colIndex, rowIndex, marker)}
            onContextMenu={e => onCellContextMenu(colIndex, rowIndex, e)}
            onInsertCell={() => onInsertCell(colIndex, rowIndex)}
            onRemoveCell={() => onRemoveCell(colIndex, rowIndex)}
          />
        ))}
      </div>

      {/* Lyrics column */}
      <div className="lyrics-col">
        {column.lyrics.map((lyric, rowIndex) => (
          <input
            key={rowIndex}
            className="lyric-input"
            type="text"
            value={lyric}
            maxLength={4}
            onChange={e => onLyricChange(colIndex, rowIndex, e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        ))}
      </div>
    </div>
  )
}
