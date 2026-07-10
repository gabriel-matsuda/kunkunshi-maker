import { useState } from 'react'
import { TUNINGS } from '../data/notes'
import { useLanguage } from '../i18n/LanguageContext'
import { LANGUAGES } from '../i18n/translations'

export default function Toolbar({ songInfo, onChange }) {
  const { lang, setLang, t } = useLanguage()
  const [fieldsOpen, setFieldsOpen] = useState(false)

  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <span className="toolbar-brand">工工四 Maker</span>
        <button
          className="toolbar-toggle-btn"
          onClick={() => setFieldsOpen(o => !o)}
          aria-label={fieldsOpen ? t('hideFields') : t('showFields')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: fieldsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <div className={`toolbar-fields${fieldsOpen ? '' : ' toolbar-fields-hidden'}`}>
        <label className="toolbar-field">
          <span>{t('title')}</span>
          <input
            type="text"
            value={songInfo.title}
            onChange={e => onChange('title', e.target.value)}
            placeholder="安里屋ユンタ"
          />
        </label>
        <label className="toolbar-field">
          <span>{t('reading')}</span>
          <input
            type="text"
            value={songInfo.titleReading}
            onChange={e => onChange('titleReading', e.target.value)}
            placeholder="あさとやユンタ"
          />
        </label>
        <label className="toolbar-field">
          <span>{t('romaji')}</span>
          <input
            type="text"
            value={songInfo.titleRomaji}
            onChange={e => onChange('titleRomaji', e.target.value)}
            placeholder="asadoya yunta"
          />
        </label>
        <label className="toolbar-field">
          <span>{t('tuning')}</span>
          <select
            value={songInfo.tuning}
            onChange={e => onChange('tuning', e.target.value)}
          >
            {TUNINGS.map(tuning => (
              <option key={tuning} value={tuning}>{tuning}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="lang-toggle">
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <button
            key={code}
            className={`lang-btn ${lang === code ? 'active' : ''}`}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  )
}
