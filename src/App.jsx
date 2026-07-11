import { useState, useRef, useEffect } from 'react'
import { makeEmptySheet, COLS, ROWS } from './data/notes'
import Toolbar from './components/Toolbar'
import NoteSelector from './components/NoteSelector'
import KunkunshiSheet from './components/KunkunshiSheet'
import { useLanguage } from './i18n/LanguageContext'
import CellContextMenu from './components/CellContextMenu'
import { serialize as serializeToml, parse as parseToml, toSheetState } from './utils/toml'
import { encodeShareData, decodeShareData, buildShareUrl, readShareFromLocation, clearShareFromLocation } from './utils/share'
import './App.css'

const MAX_IMPORT_BYTES = 1024 * 1024

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
  const [pendingBottomUp, setPendingBottomUp] = useState(false)

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
    setPendingBottomUp(false)
  }

  function handleNote2Select(page, col, row) {
    setSelectedCell({ page, col, row })
    setActiveSlot('note2')
    setPendingBottomUp(false)
  }

  function handleSlotChange(slot) {
    setActiveSlot(slot)
    setPendingBottomUp(false)
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
    const nextSel = advanceSelection(page, col, row)
    if (nextSel === null) {
      setPages(prev => [...prev, makeEmptySheet()])
      setSelectedCell({ page: page + 1, col: 0, row: 0 })
    } else {
      setSelectedCell(nextSel)
    }
    setActiveSlot('note1')
  }

  function handleNoteClick(char) {
    if (!selectedCell) return
    const { page, col, row } = selectedCell
    const nextSel = advanceSelection(page, col, row)
    const flag = activeSlot === 'note1' ? 'bottomUp1' : 'bottomUp2'
    setPages(prev => {
      const updated = prev.map((pageColumns, pIdx) =>
        pIdx === page ? clonePage(pageColumns) : pageColumns
      )
      updated[page][col].cells[row][activeSlot] = char
      if (pendingBottomUp) updated[page][col].cells[row][flag] = true
      return nextSel === null ? [...updated, makeEmptySheet()] : updated
    })
    setSelectedCell(nextSel ?? { page: page + 1, col: 0, row: 0 })
    setActiveSlot('note1')
    setPendingBottomUp(false)
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

  const pagesContainerRef = useRef(null)

  useEffect(() => {
    if (!selectedCell || !pagesContainerRef.current) return
    if (!window.matchMedia('(max-width: 768px)').matches) return
    const container = pagesContainerRef.current
    const pageEl = container.querySelector(`[data-page="${selectedCell.page}"]`)
    const cellEl = pageEl?.querySelector(`[data-col="${selectedCell.col}"][data-row="${selectedCell.row}"]`)
    const sheetWrapper = pageEl?.querySelector('.sheet-wrapper')
    if (!cellEl || !sheetWrapper) return
    const er = cellEl.getBoundingClientRect()
    const sr = sheetWrapper.getBoundingClientRect()
    const cr = container.getBoundingClientRect()
    sheetWrapper.scrollLeft = Math.max(0, sheetWrapper.scrollLeft + er.left - sr.left - (sr.width - er.width) / 2)
    container.scrollTop = Math.max(0, container.scrollTop + er.top - cr.top - (cr.height - er.height) / 2)
  }, [selectedCell])

  useEffect(() => {
    const encoded = readShareFromLocation()
    if (!encoded) return
    let cancelled = false
    decodeShareData(encoded)
      .then(next => {
        if (cancelled) return
        setSongInfo(next.songInfo)
        setPages(next.pages)
        setSelectedCell(null)
        clearShareFromLocation()
      })
      .catch(err => {
        console.error('Share decode failed:', err)
        window.alert(t('shareLoadFailed'))
        clearShareFromLocation()
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleShare() {
    window.gtag?.('event', 'share_button_click')
    try {
      const encoded = await encodeShareData({ songInfo, pages })
      const url = buildShareUrl(encoded)
      const shareData = { title: songInfo.title || 'Kunkunshi', url }
      if (navigator.share) {
        try {
          await navigator.share(shareData)
          return
        } catch (err) {
          if (err?.name === 'AbortError') return
        }
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        window.alert(t('shareCopied'))
      } else {
        window.prompt(t('shareCopyPrompt'), url)
      }
    } catch (err) {
      console.error('Share failed:', err)
      window.alert(t('shareFailed'))
    }
  }

  const fileInputRef = useRef(null)

  function slugForFilename(s) {
    return (s || '').trim().replace(/[\s/\\:*?"<>|]+/g, '_').slice(0, 40)
  }

  function handleExport() {
    window.gtag?.('event', 'export_toml_button_click')
    const text = serializeToml({ songInfo, pages })
    const blob = new Blob([text], { type: 'application/toml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = slugForFilename(songInfo.title) || 'kunkunshi'
    a.download = `${base}.toml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    window.gtag?.('event', 'import_toml_button_click')
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      window.alert(t('importTooLarge'))
      return
    }
    if (!window.confirm(t('importConfirm'))) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseToml(String(reader.result))
        const next = toSheetState(parsed)
        setSongInfo(next.songInfo)
        setPages(next.pages)
        setSelectedCell(null)
      } catch (err) {
        console.error('TOML import failed:', err)
        window.alert(t('importInvalid'))
      }
    }
    reader.onerror = () => window.alert(t('importFailed'))
    reader.readAsText(file)
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
      <div className="no-print btn-float-group">
        <button className="btn-float btn-float-secondary" onClick={handleImportClick} title={t('importToml')} aria-label={t('importToml')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
        <button className="btn-float btn-float-secondary" onClick={handleExport} title={t('exportToml')} aria-label={t('exportToml')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button className="btn-float btn-float-secondary" onClick={handleShare} title={t('share')} aria-label={t('share')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <button className="btn-float btn-print-float" onClick={() => { window.gtag?.('event', 'print_save_pdf_button_click'); window.print(); }} title={t('printSavePdf')} aria-label={t('printSavePdf')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".toml,application/toml,text/plain"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
      <div className="no-print sticky-ui">
        <Toolbar songInfo={songInfo} onChange={handleSongInfoChange} />
        <NoteSelector
          activeSlot={activeSlot}
          onSlotChange={handleSlotChange}
          onNoteClick={handleNoteClick}
          onSkip={handleSkipCell}
          onClear={handleClearCell}
          onBottomUpToggle={() => {
            if (!selectedCell) return
            const { page, col, row } = selectedCell
            const cell = pages[page][col].cells[row]
            const hasNote = activeSlot === 'note1' ? !!cell.note1 : !!cell.note2
            if (hasNote) {
              handleBottomUpToggle(page, col, row)
            } else {
              setPendingBottomUp(v => !v)
            }
          }}
          pendingBottomUp={pendingBottomUp}
          selectedCell={selectedCell}
          columns={activeColumns}
        />
      </div>
      <div className="pages-container" ref={pagesContainerRef}>
        {pages.map((columns, pageIndex) => (
          <div key={pageIndex} className="page-wrapper" data-page={pageIndex}>
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
            <div className="page-number no-print">{pageIndex + 1}/{pages.length}</div>
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
