import SheetColumn from './SheetColumn'

export default function KunkunshiSheet({ pageIndex, columns, songInfo, selectedCell, activeSlot, onCellSelect, onNote2Select, onLyricChange, onChorusToggle, onCellContextMenu, onInsertCell, onRemoveCell }) {
  // Columns are stored 0..10 where 0 = rightmost (first in reading order).
  // We render them reversed so col 0 appears on the right, col 10 on the left.
  const reversedIndices = columns.map((_, i) => i).reverse()

  // Only show selection highlight for cells belonging to this page
  const pageSelectedCell =
    selectedCell?.page === pageIndex
      ? { col: selectedCell.col, row: selectedCell.row }
      : null

  return (
    <div className="sheet-wrapper">
      <div className="kunkunshi-sheet">
        {reversedIndices.map(colIndex => (
          <SheetColumn
            key={colIndex}
            colIndex={colIndex}
            column={columns[colIndex]}
            selectedCell={pageSelectedCell}
            activeSlot={activeSlot}
            onCellSelect={(col, row) => onCellSelect(pageIndex, col, row)}
            onNote2Select={(col, row) => onNote2Select(pageIndex, col, row)}
            onLyricChange={(col, row, value) => onLyricChange(pageIndex, col, row, value)}
            onChorusToggle={(col, row, marker) => onChorusToggle(pageIndex, col, row, marker)}
            onCellContextMenu={(col, row, e) => onCellContextMenu(pageIndex, col, row, e)}
            onInsertCell={(col, row) => onInsertCell(pageIndex, col, row)}
            onRemoveCell={(col, row) => onRemoveCell(pageIndex, col, row)}
          />
        ))}

        {/* Metadata column — far right, first in reading order */}
        <div className="metadata-col">
          <div className="metadata-number">
            <span className="reading-arrow">↓</span>
          </div>
          <div className="metadata-title">
            {songInfo.title && (
              <div className="title-vertical">{songInfo.title}</div>
            )}
            {(songInfo.titleReading || songInfo.titleRomaji) && (
              <div className="reading-group">
                {songInfo.titleReading && (
                  <span className="reading-kana">（{songInfo.titleReading}）</span>
                )}
                {songInfo.titleRomaji && (
                  <span className="reading-romaji">{songInfo.titleRomaji}</span>
                )}
              </div>
            )}
          </div>
          <div className="metadata-tuning">
            {songInfo.tuning && (
              <div className="tuning-label">
                <span className="tuning-bracket">【</span>
                {songInfo.tuning}
                <span className="tuning-bracket">】</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
