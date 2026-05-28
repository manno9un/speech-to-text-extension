import { useState, useEffect, useRef, useCallback } from 'react';
import './popup.css';

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

type Status = 'idle' | 'recording' | 'error' | 'no-field';

export default function Popup() {
  const [status, setStatus] = useState<Status>('idle');
  const [language, setLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef<number | null>(null);

  // Load saved language on mount.
  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings?.language) {
        setLanguage(result.settings.language);
      }
    });
  }, []);

  // Listen for messages coming back from the content script.
  useEffect(() => {
    const listener = (message: { type: string; payload?: any }) => {
      switch (message.type) {
        case 'RECORDING_STARTED':
          setStatus('recording');
          setError(null);
          break;
        case 'TRANSCRIPT_UPDATE':
          if (message.payload?.isFinal) {
            setTranscript((prev) =>
              prev ? `${prev} ${message.payload.transcript}` : message.payload.transcript
            );
            setInterim('');
          } else {
            setInterim(message.payload?.transcript || '');
          }
          break;
        case 'RECORDING_ERROR':
          setStatus('error');
          setError(message.payload?.error || 'An error occurred.');
          stopTimer();
          break;
        case 'RECORDING_ENDED':
          setStatus('idle');
          setInterim('');
          stopTimer();
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  function stopTimer() {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  }

  async function handleStart() {
    setError(null);
    setTranscript('');
    setInterim('');

    const tab = await getActiveTab();
    if (!tab?.id) {
      setError('No active tab found.');
      setStatus('error');
      return;
    }

    const settings = await chrome.storage.local.get('settings');
    const autoInsert = settings.settings?.autoInsert ?? true;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'START_RECORDING',
        payload: { language, autoInsert },
      });

      if (response?.ok) {
        setStatus('recording');
        startTimer();
      } else {
        setStatus(response?.error?.includes('text field') ? 'no-field' : 'error');
        setError(response?.error || 'Could not start recording.');
      }
    } catch {
      setError(
        'Could not connect to this page. Try reloading the tab, or note that recording does not work on browser system pages.'
      );
      setStatus('error');
    }
  }

  async function handleStop() {
    const tab = await getActiveTab();
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' });
      } catch {
        // ignore
      }
    }
    setStatus('idle');
    stopTimer();
  }

  async function handleLanguageChange(value: string) {
    setLanguage(value);
    const current = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({
      settings: { ...(current.settings || {}), language: value },
    });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  const isRecording = status === 'recording';
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="popup">
      <header className="popup__header">
        <div className="popup__brand">
          <span className="popup__logo" aria-hidden="true" />
          <h1 className="popup__title">Speech to Text</h1>
        </div>
        <button
          className="popup__icon-btn"
          onClick={openOptions}
          aria-label="Open settings"
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      <div className="popup__record-area">
        <button
          className={`popup__record-btn ${isRecording ? 'popup__record-btn--active' : ''}`}
          onClick={isRecording ? handleStop : handleStart}
        >
          <span className="popup__mic-icon" aria-hidden="true">
            {isRecording ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </span>
        </button>
        <p className="popup__record-label">
          {isRecording ? 'Listening… click to stop' : 'Click to start recording'}
        </p>
        {isRecording && (
          <p className="popup__timer">
            {minutes}:{seconds}
          </p>
        )}
      </div>

      <div className="popup__lang-row">
        <label htmlFor="lang" className="popup__lang-label">
          Language
        </label>
        <select
          id="lang"
          className="popup__select"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={isRecording}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="popup__message popup__message--error" role="alert">
          {error}
        </div>
      )}

      {(transcript || interim) && (
        <div className="popup__transcript">
          <span>{transcript}</span>
          {interim && <span className="popup__interim"> {interim}</span>}
        </div>
      )}

      <footer className="popup__footer">
        <span className="popup__hint">
          Tip: focus a text field, then record. Shortcut: Ctrl+Shift+S
        </span>
      </footer>
    </div>
  );
}
