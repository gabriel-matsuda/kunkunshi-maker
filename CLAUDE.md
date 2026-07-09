# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server at localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

No test suite exists yet. Use Playwright (already installed as a dev dependency) for browser-level verification:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173');
```

## Architecture

### Domain

Kunkunshi (工工四) is the traditional Okinawan music notation system. This app is a browser-based editor for creating sanshin (three-stringed lute) kunkunshi sheets, printable as PDF via the browser's print dialog.

A sheet is **11 columns × 12 rows = 132 cells**, read **right to left, top to bottom**. Each column is a notation column paired with a narrow lyrics column. A metadata column on the far right holds the song title, reading, song number, and tuning key.

### State (App.jsx)

All state lives in `App`. Key pieces:

| State | Shape | Purpose |
|---|---|---|
| `columns` | `Column[11]` | Sheet data: `cells: Cell[12]`, `lyrics: string[12]` |
| `selectedCell` | `{ col, row } \| null` | Which cell is active |
| `activeSlot` | `'note1' \| 'note2'` | Which slot a palette click fills |
| `songInfo` | `{ title, titleReading, songNumber, tuning }` | Metadata column content |

`Cell` shape: `{ note1: string, note2: string, chorusStart: bool, chorusEnd: bool }`

Column index `0` = first in reading order = **rightmost** on screen. The render order is reversed (`columns.map((_, i) => i).reverse()`) so index 0 renders last in the DOM and appears on the right.

### Note2 (half-time note) positioning

`note2` is **not** rendered inside the cell's normal flow. It is `position: absolute; bottom: -9px` on the **parent cell**, so it visually straddles the border between that cell and the cell below. Clicking `note2` directly selects it (sets `selectedCell` to the owning cell + switches `activeSlot` to `'note2'`).

### Column border strategy

Each `.sheet-column-group` has `border-left: 2px solid #111` (except `:first-child`). Each `.notation-col` has `border-right: 2px solid #111`. This gives every notation column a complete left + right border without doubling up at any boundary:

```
sheet-left | notation | 2px | lyrics | 2px (next group's left) | notation | ...
```

`.metadata-col` also has `border-left: 2px` to close off the last lyrics column.

### Print

`@media print` in `index.css` hides `.no-print` (toolbar + note selector) and sets `@page { size: A4 landscape; margin: 10mm }`. The sheet renders as-is. Chorus markers that are not `on` are hidden; `on` markers remain visible at full opacity.

### Data constants (`src/data/notes.js`)

- `NOTES` — array of `{ char, reading }` for the 12 note buttons: 合乙老四上中工五六七八○
- `TUNINGS` — dropdown options: 本調子 二揚げ 三下げ 深調子
- `COLS = 11`, `ROWS = 12`
- `makeEmptySheet()` — factory for the initial `columns` state
