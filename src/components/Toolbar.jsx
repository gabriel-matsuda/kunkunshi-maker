import { TUNINGS } from '../data/notes'
import { useLanguage } from '../i18n/LanguageContext'
import { LANGUAGES } from '../i18n/translations'

export default function Toolbar({ songInfo, onChange }) {
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <span className="toolbar-brand">工工四 Maker</span>
      </div>
      <div className="toolbar-fields">
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
