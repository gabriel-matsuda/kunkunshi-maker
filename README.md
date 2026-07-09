# 工工四 Maker

A browser-based editor for creating **kunkunshi** (工工四) — the traditional notation system used for the Okinawan sanshin (三線), a three-stringed lute at the heart of Ryukyuan music.

Whether you're transcribing a classic like 安里屋ユンタ (Asadoya Yunta) or composing something new, this tool lets you build and print beautiful kunkunshi sheets without any special software.

---

## Features

- **11-column × 12-row sheet layout** — the standard kunkunshi format, read right to left, top to bottom
- **Multi-page support** — add as many pages as your song needs; content flows correctly between pages when inserting or removing cells
- **Full note palette** — all standard sanshin notes including extended notes (下老, 尺, 尺♯, 下尺, 九, and more)
- **Bottom-up stroke marker (¬)** — mark notes played with an upstroke, independently for both note slots
- **Half-time (2nd note)** — place a smaller half-time note that straddles the cell border
- **Chorus markers** — toggle ↑/↓ repeat section markers on any cell
- **Insert & remove cells** — right-click any cell or use the hover ＋/－ buttons; content shifts across all pages
- **Lyrics** — add vertical lyric text alongside each notation column
- **Song metadata** — title, reading (furigana), romaji, and tuning displayed in the metadata column
- **Auto-advance** — cursor moves to the next cell automatically after placing a note
- **Skip cell** — jump to the next cell without placing a note
- **Print / Save PDF** — prints as A4 landscape; UI elements are hidden, each page breaks correctly
- **Multi-language UI** — English, Português, Español, 日本語

---

## Getting Started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

---

## How to Use

1. Fill in the song title, reading, and romaji in the top toolbar
2. Select the tuning (本調子, 二揚げ, 三下げ, 深調子)
3. Click any cell on the sheet to select it — the first cell is selected on load
4. Click a note button to place it; the cursor advances automatically
5. Use **1st note / 2nd note** to switch between the two note slots per cell
6. Use **¬** to mark a note as a bottom-up (upstroke) note
7. Toggle the **↑ / ↓** chorus markers by hovering over a cell and clicking the right-side arrows
8. **Right-click** any cell for insert/remove options, or use the hover **＋ / －** buttons
9. Add pages with the **＋ Add page** button at the bottom; remove them with **× Remove page**
10. Click the **printer button** (bottom-right) to print or save as PDF

---

## Note Reference

| Character | Reading |
|---|---|
| 合 | ai |
| 乙 | otsu |
| 老 | rou |
| 下老 | shita-rou |
| 四 | shi |
| 上 | jou |
| 中 | chuu |
| 尺 | shaku |
| 尺♯ | shaku-sharp |
| 下尺 | shita-shaku |
| 工 | kou |
| 五 | go |
| 六 | roku |
| 七 | shichi |
| 八 | hachi |
| 九 | kyū |
| ○ | rest |

---

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- Plain CSS (no UI framework)
- [Playwright](https://playwright.dev/) available for browser-level testing

---

*Built with love for the music of the Ryukyu Islands. 島唄を楽しんでください！*
