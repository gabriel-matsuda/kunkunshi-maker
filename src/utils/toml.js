import { makeEmptySheet, COLS, ROWS, TUNINGS } from '../data/notes'

const FLAG_CHORUS_START = 1
const FLAG_CHORUS_END = 2
const FLAG_BOTTOM_UP_1 = 4
const FLAG_BOTTOM_UP_2 = 8

function escapeString(s) {
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0)
    if (ch === '\\') out += '\\\\'
    else if (ch === '"') out += '\\"'
    else if (ch === '\n') out += '\\n'
    else if (ch === '\r') out += '\\r'
    else if (ch === '\t') out += '\\t'
    else if (code < 0x20 || code === 0x7f) out += '\\u' + code.toString(16).padStart(4, '0')
    else out += ch
  }
  return '"' + out + '"'
}

export function serialize(state) {
  const { songInfo, pages } = state
  const lines = []
  lines.push('version = 1')
  lines.push('')
  lines.push('[song]')
  lines.push(`title = ${escapeString(songInfo.title ?? '')}`)
  lines.push(`titleReading = ${escapeString(songInfo.titleReading ?? '')}`)
  lines.push(`titleRomaji = ${escapeString(songInfo.titleRomaji ?? '')}`)
  lines.push(`tuning = ${escapeString(songInfo.tuning ?? '')}`)
  lines.push('')

  for (const columns of pages) {
    lines.push('[[pages]]')
    const entries = []
    for (let col = 0; col < COLS; col++) {
      const column = columns[col]
      for (let row = 0; row < ROWS; row++) {
        const cell = column.cells[row]
        const lyric = column.lyrics[row] ?? ''
        let flags = 0
        if (cell.chorusStart) flags |= FLAG_CHORUS_START
        if (cell.chorusEnd) flags |= FLAG_CHORUS_END
        if (cell.bottomUp1) flags |= FLAG_BOTTOM_UP_1
        if (cell.bottomUp2) flags |= FLAG_BOTTOM_UP_2
        if (!cell.note1 && !cell.note2 && !flags && !lyric) continue
        entries.push(`  [${col}, ${row}, ${escapeString(cell.note1 || '')}, ${escapeString(cell.note2 || '')}, ${flags}, ${escapeString(lyric)}]`)
      }
    }
    if (entries.length === 0) {
      lines.push('cells = []')
    } else {
      lines.push('cells = [')
      lines.push(entries.join(',\n') + ',')
      lines.push(']')
    }
    lines.push('')
  }

  return lines.join('\n')
}

function parseString(src, i) {
  if (src[i] !== '"') throw new Error(`Expected '"' at ${i}`)
  i++
  let out = ''
  while (i < src.length) {
    const ch = src[i]
    if (ch === '"') return [out, i + 1]
    if (ch === '\\') {
      const next = src[i + 1]
      if (next === 'n') { out += '\n'; i += 2 }
      else if (next === 'r') { out += '\r'; i += 2 }
      else if (next === 't') { out += '\t'; i += 2 }
      else if (next === '"') { out += '"'; i += 2 }
      else if (next === '\\') { out += '\\'; i += 2 }
      else if (next === 'u') {
        out += String.fromCodePoint(parseInt(src.slice(i + 2, i + 6), 16))
        i += 6
      } else if (next === 'U') {
        out += String.fromCodePoint(parseInt(src.slice(i + 2, i + 10), 16))
        i += 10
      } else throw new Error(`Bad escape at ${i}`)
    } else {
      out += ch
      i++
    }
  }
  throw new Error('Unterminated string')
}

function parseInteger(src, i) {
  const start = i
  if (src[i] === '-' || src[i] === '+') i++
  while (i < src.length && /[0-9]/.test(src[i])) i++
  if (i === start) throw new Error(`Expected integer at ${start}`)
  return [parseInt(src.slice(start, i), 10), i]
}

function skipWs(src, i) {
  while (i < src.length && (src[i] === ' ' || src[i] === '\t' || src[i] === '\n' || src[i] === '\r' || src[i] === ',')) i++
  return i
}

function parseCellArray(src, i) {
  if (src[i] !== '[') throw new Error(`Expected '[' at ${i}`)
  i++
  const values = []
  while (true) {
    i = skipWs(src, i)
    if (src[i] === ']') return [values, i + 1]
    if (src[i] === '"') {
      const [s, ni] = parseString(src, i)
      values.push(s); i = ni
    } else {
      const [n, ni] = parseInteger(src, i)
      values.push(n); i = ni
    }
  }
}

function parseCellsArray(src, i) {
  if (src[i] !== '[') throw new Error(`Expected '[' at ${i}`)
  i++
  const rows = []
  while (true) {
    i = skipWs(src, i)
    if (src[i] === ']') return [rows, i + 1]
    if (src[i] !== '[') throw new Error(`Expected '[' at ${i}`)
    const [row, ni] = parseCellArray(src, i)
    rows.push(row); i = ni
  }
}

function skipToEol(src, i) {
  while (i < src.length && src[i] !== '\n') i++
  return i < src.length ? i + 1 : i
}

function skipTrivia(src, i) {
  while (i < src.length) {
    const ch = src[i]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') i++
    else if (ch === '#') i = skipToEol(src, i)
    else break
  }
  return i
}

export function parse(src) {
  const state = { version: null, songInfo: {}, pages: [] }
  let i = 0
  let section = null // 'song' | 'pages' | null
  while (i < src.length) {
    i = skipTrivia(src, i)
    if (i >= src.length) break
    if (src[i] === '[') {
      if (src[i + 1] === '[') {
        const end = src.indexOf(']]', i + 2)
        if (end < 0) throw new Error('Unterminated table array header')
        const name = src.slice(i + 2, end).trim()
        if (name !== 'pages') throw new Error(`Unknown table array [[${name}]]`)
        section = 'pages'
        state.pages.push({ cells: [] })
        i = end + 2
        continue
      }
      const end = src.indexOf(']', i + 1)
      if (end < 0) throw new Error('Unterminated table header')
      const name = src.slice(i + 1, end).trim()
      section = name
      i = end + 1
      continue
    }
    // key = value
    const eq = src.indexOf('=', i)
    if (eq < 0) break
    const key = src.slice(i, eq).trim()
    let j = skipTrivia(src, eq + 1)
    let value
    if (src[j] === '"') {
      ;[value, j] = parseString(src, j)
    } else if (src[j] === '[') {
      if (key === 'cells') {
        ;[value, j] = parseCellsArray(src, j)
      } else {
        ;[value, j] = parseCellArray(src, j)
      }
    } else {
      ;[value, j] = parseInteger(src, j)
    }
    if (section === null && key === 'version') state.version = value
    else if (section === 'song') state.songInfo[key] = value
    else if (section === 'pages' && key === 'cells') {
      state.pages[state.pages.length - 1].cells = value
    }
    i = j
  }
  return state
}

export function toSheetState(parsed) {
  if (parsed.version !== 1) {
    throw new Error(`Unsupported file version: ${parsed.version}`)
  }
  const s = parsed.songInfo || {}
  const songInfo = {
    title: typeof s.title === 'string' ? s.title : '',
    titleReading: typeof s.titleReading === 'string' ? s.titleReading : '',
    titleRomaji: typeof s.titleRomaji === 'string' ? s.titleRomaji : '',
    tuning: TUNINGS.includes(s.tuning) ? s.tuning : TUNINGS[0],
  }
  const pages = (parsed.pages && parsed.pages.length > 0 ? parsed.pages : [{ cells: [] }]).map(p => {
    const columns = makeEmptySheet()
    for (const entry of p.cells || []) {
      const [col, row, note1, note2, flags, lyric] = entry
      if (typeof col !== 'number' || typeof row !== 'number') continue
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue
      columns[col].cells[row] = {
        note1: typeof note1 === 'string' ? note1 : '',
        note2: typeof note2 === 'string' ? note2 : '',
        chorusStart: !!(flags & FLAG_CHORUS_START),
        chorusEnd: !!(flags & FLAG_CHORUS_END),
        bottomUp1: !!(flags & FLAG_BOTTOM_UP_1),
        bottomUp2: !!(flags & FLAG_BOTTOM_UP_2),
      }
      columns[col].lyrics[row] = typeof lyric === 'string' ? lyric : ''
    }
    return columns
  })
  return { songInfo, pages }
}
