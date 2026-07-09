import { useState } from 'react'
import { makeEmptySheet, COLS, ROWS } from './data/notes'
import Toolbar from './components/Toolbar'
import NoteSelector from './components/NoteSelector'
import KunkunshiSheet from './components/KunkunshiSheet'
import { useLanguage } from './i18n/LanguageContext'
import CellContextMenu from './components/CellContextMenu'
import './App.css'

const initialSongInfo = {
  title: '',
  titleReading: '',
  titleRomaji: '',
  tuning: '本調子',
}

const emptyCell = () => ({ note1: '', note2: '', chorusStart: false, chorusEnd: false, bottomUp1: false, bottomUp2: false })

const PAGE_SIZE = COLS * ROWS

function flattenAllPages(allPages) {
  const items = []
  for (const pageColumns of allPages) {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        items.push({ cell: { ...pageColumns[col].cells[row] }, lyric: pageColumns[col].lyrics[row] })
      }
    }
  }
  return items
}

function unflattenAllPages(flat, allPages) {
  return allPages.map((pageColumns, pageIdx) => {
    const next = clonePage(pageColumns)
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const idx = pageIdx * PAGE_SIZE + col * ROWS + row
        next[col].cells[row] = flat[idx].cell
        next[col].lyrics[row] = flat[idx].lyric
      }
    }
    return next
  })
}

function clonePage(pageColumns) {
  return pageColumns.map(c => ({
    ...c,
    cells: c.cells.map(cell => ({ ...cell })),
    lyrics: [...c.lyrics],
  }))
}

export default function App() {
  const { t } = useLanguage()
  const [songInfo, setSongInfo] = useState(initialSongInfo)
  const [pages, setPages] = useState([makeEmptySheet()])
  const [selectedCell, setSelectedCell] = useState({ page: 0, col: 0, row: 0 })
  const [activeSlot, setActiveSlot] = useState('note1')

  function handleSongInfoChange(field, value) {
    setSongInfo(prev => ({ ...prev, [field]: value }))
  }

  function handleCellSelect(page, col, row) {
    setSelectedCell(prev =>
      prev?.page === page && prev?.col === col && prev?.row === row
        ? null
        : { page, col, row }
    )
    setActiveSlot('note1')
  }

  function handleNote2Select(page, col, row) {
    setSelectedCell({ page, col, row })
    setActiveSlot('note2')
  }

  function advanceSelection(page, col, row) {
    if (row < ROWS - 1) return { page, col, row: row + 1 }
    if (col < COLS - 1) return { page, col: col + 1, row: 0 }
    if (page < pages.length - 1) return { page: page + 1, col: 0, row: 0 }
    return null
  }

  function handleSkipCell() {
    if (!selectedCell) return
    const { page, col, row } = selectedCell
    setSelectedCell(advanceSelection(page, col, row))
    setActiveSlot('note1')
  }

  function handleNoteClick(char) {
    if (!selectedCell) return
    const { page, col, row } = selectedCell
    if (activeSlot === 'note2' && !pages[page][col].cells[row].note1) return
    setPages(prev => {
      const next = prev.map((pageColumns, pIdx) =>
        pIdx === page ? clonePage(pageColumns) : pageColumns
      )
      next[page][col].cells[row][activeSlot] = char
      return next
    })
    setSelectedCell(advanceSelection(page, col, row))
    setActiveSlot('note1')
  }

  function handleClearCell() {
    if (!selectedCell) return
    const { page, col, row } = selectedCell
    setPages(prev => {
      const next = prev.map((pageColumns, pIdx) =>
        pIdx === page ? clonePage(pageColumns) : pageColumns
      )
      next[page][col].cells[row] = { note1: '', note2: '', chorusStart: false, chorusEnd: false, bottomUp1: false, bottomUp2: false }
      return next
    })
  }

  function handleLyricChange(page, col, row, value) {
    setPages(prev => {
      const next = prev.map((pageColumns, pIdx) =>
        pIdx === page ? clonePage(pageColumns) : pageColumns
      )
      next[page][col].lyrics[row] = value
      return next
    })
  }

  function handleBottomUpToggle(page, col, row) {
    const flag = activeSlot === 'note1' ? 'bottomUp1' : 'bottomUp2'
    setPages(prev => {
      const next = prev.map((pageColumns, pIdx) =>
        pIdx === page ? clonePage(pageColumns) : pageColumns
      )
      next[page][col].cells[row][flag] = !next[page][col].cells[row][flag]
      return next
    })
  }

  function handleChorusToggle(page, col, row, marker) {
    setPages(prev => {
      const next = prev.map((pageColumns, pIdx) =>
        pIdx === page ? clonePage(pageColumns) : pageColumns
      )
      next[page][col].cells[row][marker] = !next[page][col].cells[row][marker]
      return next
    })
  }

  function handleAddPage() {
    setPages(prev => [...prev, makeEmptySheet()])
  }

  function handleRemovePage(pageIndex) {
    if (!window.confirm(t('removePageConfirm'))) return
    setPages(prev => prev.filter((_, i) => i !== pageIndex))
    setSelectedCell(prev =>
      prev === null
        ? null
        : prev.page === pageIndex
          ? null
          : prev.page > pageIndex
            ? { ...prev, page: prev.page - 1 }
            : prev
    )
  }

  const [contextMenu, setContextMenu] = useState(null) // { x, y, page, col, row }

  function handleCellContextMenu(page, col, row, e) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, page, col, row })
  }

  function handleInsertCell(page, col, row) {
    setPages(prev => {
      const flat = flattenAllPages(prev)
      flat.splice(page * PAGE_SIZE + col * ROWS + row, 0, { cell: emptyCell(), lyric: '' })
      flat.pop()
      return unflattenAllPages(flat, prev)
    })
  }

  function handleRemoveCell(page, col, row) {
    setPages(prev => {
      const flat = flattenAllPages(prev)
      flat.splice(page * PAGE_SIZE + col * ROWS + row, 1)
      flat.push({ cell: emptyCell(), lyric: '' })
      return unflattenAllPages(flat, prev)
    })
  }

  const activeColumns = selectedCell ? pages[selectedCell.page] : pages[0]

  return (
    <div className="app" onClick={() => setContextMenu(null)}>
      {contextMenu && (
        <CellContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onInsert={() => { handleInsertCell(contextMenu.page, contextMenu.col, contextMenu.row); setContextMenu(null) }}
          onRemove={() => { handleRemoveCell(contextMenu.page, contextMenu.col, contextMenu.row); setContextMenu(null) }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <button className="no-print btn-print-float" onClick={() => { window.gtag?.('event', 'print'); window.print(); }} title={t('printSavePdf')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
      </button>
      <div className="no-print sticky-ui">
        <Toolbar songInfo={songInfo} onChange={handleSongInfoChange} />
        <NoteSelector
          activeSlot={activeSlot}
          onSlotChange={setActiveSlot}
          onNoteClick={handleNoteClick}
          onSkip={handleSkipCell}
          onClear={handleClearCell}
          onBottomUpToggle={() => {
            if (!selectedCell) return
            handleBottomUpToggle(selectedCell.page, selectedCell.col, selectedCell.row)
          }}
          selectedCell={selectedCell}
          columns={activeColumns}
        />
      </div>
      <div className="pages-container">
        {pages.map((columns, pageIndex) => (
          <div key={pageIndex} className="page-wrapper">
            <KunkunshiSheet
              pageIndex={pageIndex}
              columns={columns}
              songInfo={songInfo}
              selectedCell={selectedCell}
              activeSlot={activeSlot}
              onCellSelect={handleCellSelect}
              onNote2Select={handleNote2Select}
              onLyricChange={handleLyricChange}
              onChorusToggle={handleChorusToggle}
              onCellContextMenu={handleCellContextMenu}
              onInsertCell={handleInsertCell}
              onRemoveCell={handleRemoveCell}
            />
            <div className="page-number">{pageIndex + 1}/{pages.length}</div>
            <div className="no-print add-page-row">
              <span className="add-page-line" />
              {pages.length > 1 && (
                <button
                  className="btn-remove-page"
                  onClick={() => handleRemovePage(pageIndex)}
                >
                  × {t('removePage')} {pageIndex + 1}
                </button>
              )}
              <button className="btn-add-page" onClick={handleAddPage}>{t('addPage')}</button>
              <span className="add-page-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
