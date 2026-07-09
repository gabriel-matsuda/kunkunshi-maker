export const NOTES = [
  { char: '合', reading: 'ai' },
  { char: '乙', reading: 'otsu' },
  { char: '老', reading: 'rou' },
  { char: '下老', reading: 'shita-rou' },
  { char: '四', reading: 'shi' },
  { char: '上', reading: 'jou' },
  { char: '中', reading: 'chuu' },
  { char: '尺', reading: 'shaku' },
  { char: '尺♯', reading: 'shaku-sharp' },
  { char: '下尺', reading: 'shita-shaku' },
  { char: '工', reading: 'kou' },
  { char: '五', reading: 'go' },
  { char: '六', reading: 'roku' },
  { char: '七', reading: 'shichi' },
  { char: '八', reading: 'hachi' },
  { char: '九', reading: 'kyū' },
  { char: '○', reading: 'rest' },
]

export const TUNINGS = [
  '本調子',
  '二揚げ',
  '三下げ',
  '深調子',
]

export const COLS = 11
export const ROWS = 12

export function makeEmptySheet() {
  return Array.from({ length: COLS }, () => ({
    cells: Array.from({ length: ROWS }, () => ({
      note1: '',
      note2: '',
      chorusStart: false,
      chorusEnd: false,
      bottomUp1: false,
      bottomUp2: false,
    })),
    lyrics: Array.from({ length: ROWS }, () => ''),
  }))
}
