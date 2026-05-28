import { useState, useEffect } from 'react';
import './options.css';

const LANGUAGES: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (BR)',
  'ru-RU': 'Russian',
  'ja-JP': 'Japanese',
  'zh-CN': 'Chinese',
  'ko-KR': 'Korean',
  'hi-IN': 'Hindi',
  'nl-NL': 'Dutch',
};

interface Settings {
  language: string;
  keepHistory: boolean;
  historyDays: number;
  autoInsert: boolean;
  autoCapitalize: boolean;
}

const DEFAULTS: Settings = {
  language: 'en-US',
  keepHistory: false,
  historyDays: 7,
  autoInsert: true,
  autoCapitalize: true,
};

export default function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) {
        setSettings({ ...DEFAULTS, ...result.settings });
      }
    });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    await chrome.storage.local.set({ settings });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    setSettings(DEFAULTS);
    await chrome.storage.local.set({ settings: DEFAULTS });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="options">
      <div className="options__card">
        <header className="options__header">
          <h1 className="options__title">Speech to Text — Settings</h1>
          <p className="options__subtitle">
            Configure how speech recognition and text insertion behave.
          </p>
        </header>

        <section className="options__section">
          <div className="options__row">
            <div className="options__row-text">
              <span className="options__label">Default language</span>
              <span className="options__desc">
                The language used for speech recognition.
              </span>
            </div>
            <select
              className="options__select"
              value={settings.language}
              onChange={(e) => update('language', e.target.value)}
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="options__row">
            <div className="options__row-text">
              <span className="options__label">Insert text live</span>
              <span className="options__desc">
                Insert words as you speak, instead of all at once when you stop.
              </span>
            </div>
            <Toggle
              checked={settings.autoInsert}
              onChange={(v) => update('autoInsert', v)}
            />
          </div>

          <div className="options__row">
            <div className="options__row-text">
              <span className="options__label">Auto-capitalize</span>
              <span className="options__desc">
                Capitalize the first letter of inserted text.
              </span>
            </div>
            <Toggle
              checked={settings.autoCapitalize}
              onChange={(v) => update('autoCapitalize', v)}
            />
          </div>

          <div className="options__row">
            <div className="options__row-text">
              <span className="options__label">Keep history</span>
              <span className="options__desc">
                Store recent transcriptions locally on this device.
              </span>
            </div>
            <Toggle
              checked={settings.keepHistory}
              onChange={(v) => update('keepHistory', v)}
            />
          </div>

          {settings.keepHistory && (
            <div className="options__row">
              <div className="options__row-text">
                <span className="options__label">History retention</span>
                <span className="options__desc">
                  How many days to keep transcription history.
                </span>
              </div>
              <select
                className="options__select"
                value={settings.historyDays}
                onChange={(e) => update('historyDays', Number(e.target.value))}
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          )}
        </section>

        <footer className="options__footer">
          <button className="options__btn options__btn--ghost" onClick={handleReset}>
            Reset to defaults
          </button>
          <div className="options__footer-right">
            {saved && <span className="options__saved">Saved</span>}
            <button className="options__btn options__btn--primary" onClick={handleSave}>
              Save changes
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__knob" />
    </button>
  );
}
