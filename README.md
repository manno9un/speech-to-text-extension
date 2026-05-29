# Speech to Text — Chrome Extension

Convert speech to text in any input field on the web. Click the microphone, speak, and your words appear in the focused text box — emails, chat boxes, search bars, comment fields, and more.

Built on the browser's native Web Speech API: no API key, no account, no cost to use.

---

## Table of contents

- [Features](#features)
- [Tools used](#tools-used)
- [How the data flows](#how-the-data-flows)
- [Project structure](#project-structure)
- [Download and install](#download-and-install)
- [Building from source](#building-from-source)
- [Usage](#usage)
- [Settings](#settings)
- [Supported input fields](#supported-input-fields)
- [Privacy](#privacy)
- [Browser support](#browser-support)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Possible future features](#possible-future-features)
- [License](#license)

---

## Features

- **One-click recording** — click the toolbar icon (or use a keyboard shortcut) to start speaking.
- **Live text insertion** — transcribed words appear in the focused field as you speak.
- **Works across the web** — standard inputs, textareas, and rich `contentEditable` editors like Gmail and Slack.
- **Live transcript** — see what's being recognized in the popup in real time.
- **Multiple languages** — choose your recognition language.
- **Keyboard shortcut** — toggle recording with `Ctrl+Shift+S` (`Cmd+Shift+S` on macOS).
- **Local preferences** — settings and optional history stored on your device.

---

## Tools used

| Layer | Tool | Why it was chosen |
|------|------|-------------------|
| Language | **TypeScript** | Type safety across the boundaries between the popup, content script, and background worker. |
| UI framework | **React 18** | Component-based popup and settings page with simple state. |
| Styling | **Plain scoped CSS** | The UI is small; a styling framework would add weight without benefit. |
| Bundler | **Vite** | Fast builds and a clean multi-entry configuration. |
| Speech engine | **Web Speech API** | Native to the browser — free, speaker-independent, no API key. |
| Testing | **Jest** | Unit testing for the core logic. |
| Extension format | **Manifest V3** | The current Chrome extension standard. |

---

## How the data flows

Voice goes in one end and text comes out the other, passing through four cooperating parts:

```
Your voice
   |
Microphone  (the browser captures audio)
   |
Web Speech API  (audio is converted to text)
   |
speechService.ts  (receives the transcript)
   |
Popup UI  (shows live text)  <->  storageService.ts  (reads/writes your settings)
   |
Content script  (runs inside the web page)
   |
textInjection.ts  (finds the field you focused)
   |
Text appears in the email / chat / form
```

Step by step:

1. You focus a text field and start recording (toolbar icon or shortcut).
2. The browser captures microphone audio.
3. The **Web Speech API** converts the audio to text. Chrome routes the audio through Google's speech-recognition service and returns a transcript — this is a built-in browser capability, not something the extension implements itself.
4. `speechService.ts` receives the transcript and forwards it to the popup for live display.
5. The **content script** (running inside the page) receives the text. It has been tracking which field you focused, so it knows where the text belongs even after the popup takes focus.
6. `textInjection.ts` inserts the text into that field.

A background **service worker** coordinates the keyboard shortcut and stores default settings. Since the popup and the web page are isolated in Chrome, they communicate through Chrome's message-passing system.

---

## Project structure

```
my-speech-extension/
├── src/
│   ├── manifest.json            Chrome extension configuration (Manifest V3)
│   ├── popup/
│   │   ├── popup.html           Popup entry point
│   │   ├── main.tsx             Mounts the React popup
│   │   ├── Popup.tsx            Popup UI: record button, transcript, language
│   │   └── popup.css            Popup styling
│   ├── options/
│   │   ├── options.html         Settings page entry point
│   │   ├── main.tsx             Mounts the React settings page
│   │   ├── Options.tsx          Settings UI
│   │   └── options.css          Settings styling
│   ├── content/
│   │   └── content.ts           Runs in the page: hosts recognition + injects text
│   ├── background/
│   │   └── background.ts        Service worker: keyboard shortcut + defaults
│   ├── services/
│   │   ├── speechService.ts     Web Speech API wrapper
│   │   └── storageService.ts    chrome.storage wrapper for settings + history
│   ├── utils/
│   │   ├── textInjection.ts     Inserts text into inputs / textareas / contentEditable
│   │   └── logger.ts            Lightweight logging for debugging
│   └── types/
│       └── index.ts             Shared TypeScript types
├── scripts/
│   └── copy-assets.js           Post-build: copies manifest + icons, flattens HTML
├── public/
│   └── icons/                   Extension icons (16, 48, 128, 192 px)
├── tests/
│   └── setup.ts                 Jest test environment setup
├── vite.config.ts               Main build: popup + options pages
├── vite.content.config.ts       Separate build: content script (single bundled file)
├── vite.background.config.ts    Separate build: service worker (clean ES module)
├── tsconfig.json
├── jest.config.js
├── package.json
└── README.md
```

---

## Download and install

The extension is loaded manually as an "unpacked" extension. There are two ways to get the code.

### Option A — Download the ZIP (no Git required)

1. On the GitHub project page, click the green **Code** button, then **Download ZIP**.
2. Extract the ZIP to a folder on your computer.
3. Open a terminal in that folder and follow [Building from source](#building-from-source).

### Option B — Clone with Git

```bash
git clone https://github.com/YOUR_USERNAME/speech-to-text-extension.git
cd speech-to-text-extension
```

Then follow [Building from source](#building-from-source).

### Loading it into Chrome

After building (which produces a `dist/` folder):

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `dist/` folder.
5. The microphone icon appears in your toolbar. If you don't see it, click the puzzle-piece icon and pin it.

---

## Building from source

### Prerequisites

- [Node.js](https://nodejs.org) version 18 or higher
- A Chromium-based browser (Chrome, Edge, or Brave)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build
```

The build runs four steps in sequence:

1. `build:main` — builds the popup and options pages.
2. `build:content` — bundles the content script into a single self-contained file (required by Chrome).
3. `build:background` — builds the service worker as a clean ES module.
4. `build:assets` — copies the manifest and icons into `dist/` and flattens the HTML.

The finished extension lands in `dist/`, ready to load unpacked.

### Other commands

```bash
npm test            # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run dev         # Start the Vite dev server
```

### Development loop

After changing code, re-run `npm run build`, then click the reload icon on the extension's card at `chrome://extensions/`.

---

## Usage

1. Click into a text field on any web page (the cursor should be blinking in it).
2. Click the extension's microphone icon, or press `Ctrl+Shift+S` (`Cmd+Shift+S` on macOS).
3. The first time, Chrome asks for microphone permission — click **Allow**.
4. Speak. Your words appear live in the popup and are inserted into the field.
5. Click the microphone again (or use the shortcut) to stop.

**Tip:** focus the text field *before* recording. If you open the popup first, the extension still remembers the last field you clicked into.

---

## Settings

Open the settings page from the gear icon in the popup:

- **Default language** — the language used for speech recognition.
- **Insert text live** — insert words as you speak, or wait and insert everything when you stop.
- **Auto-capitalize** — capitalize the first letter of inserted text.
- **Keep history** — store recent transcriptions locally on your device.
- **History retention** — how many days to keep history (when enabled).

Settings are saved to `chrome.storage.local` and persist on your device.

---

## Supported input fields

- Text inputs (`<input type="text">` and similar)
- Textareas (`<textarea>`)
- ContentEditable editors (Gmail, Slack, and similar rich editors)

Some heavily scripted sites resist programmatic text insertion; behavior can vary on those.

---

## Privacy

- The extension uses the browser's built-in Web Speech API. When you record, Chrome sends the audio to Google's speech-recognition service to convert it to text and returns the transcript. This means **an internet connection is required, and audio briefly leaves your device during transcription.**
- The extension itself runs no analytics or tracking.
- Settings and optional history are stored locally via `chrome.storage.local`, not on any server operated by this project.

---

## Browser support

| Browser | Support |
|---------|---------|
| Chrome  | Full |
| Edge    | Full (Chromium-based) |
| Brave   | Full (Chromium-based) |
| Firefox | Limited — different Speech API behavior |

---

## Known limitations

- **System pages are off-limits.** Recording does not work on `chrome://` pages, the new-tab page, or the Chrome Web Store, because extensions cannot run content scripts there.
- **Newly opened tabs.** A tab open *before* the extension was loaded or reloaded needs a refresh before recording works on it.
- **Recognition accuracy** depends on microphone quality, background noise, accent, and vocabulary. Good for everyday dictation, but not a substitute for a paid high-accuracy service.
- **Punctuation** is limited — the Web Speech API does not reliably add commas and periods.

---

## Troubleshooting

**"Could not connect to this page."**
The tab was open before the extension loaded. Refresh the tab (F5) and try again.

**Microphone permission denied.**
Check Chrome's microphone settings at `chrome://settings/content/microphone` and make sure access is allowed.

**Text isn't inserting.**
Make sure a text field is focused. Some heavily scripted sites resist programmatic insertion; try a plain text field to confirm the extension itself is working.

**Nothing happens at all.**
Open the page console (F12) and look for the line `Speech-to-text content script loaded.` If it's missing, reload the tab; if it persists, rebuild and reload the extension.

---

## Possible future features

- OpenAI Whisper API fallback for improved accuracy
- Support for more languages
- Transcription history with timestamps
- Edit transcriptions before inserting
- Custom punctuation rules
- Offline mode support
- Firefox extension version

---

## Contributing

Found a bug or have a feature idea? Open an issue or submit a pull request.

## License

MIT — free to use, modify, and share.
