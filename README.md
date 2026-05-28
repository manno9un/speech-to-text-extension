# Speech to Text Chrome Extension

Convert speech to text for any web input field. Click the microphone icon, speak, and your words appear instantly in emails, chats, forms, and more.

## Features

- 🎤 **One-click recording** — Click the toolbar button to start speaking
- 📝 **Instant text insertion** — Transcribed text appears automatically in any text field
- 🌍 **Works everywhere** — Gmail, Slack, Twitter, custom forms, and more
- 🔒 **Privacy-first** — Audio processing happens locally with Web Speech API
- ⌨️ **Keyboard shortcut** — Toggle recording with `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
- ⚙️ **Customizable** — Choose language and adjust settings

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite (fast, modern build tool)
- **Styling**: Tailwind CSS
- **Speech API**: Web Speech API (built-in browser API)
- **Testing**: Jest + React Testing Library
- **Extension Format**: Chrome Manifest V3

## Project Structure

```
my-speech-extension/
├── src/
│   ├── manifest.json          # Chrome extension configuration
│   ├── popup/
│   │   ├── popup.html         # Popup UI entry point
│   │   ├── Popup.tsx          # Main popup component
│   │   └── popup.css          # Popup styles
│   ├── options/
│   │   ├── options.html
│   │   ├── Options.tsx        # Settings page
│   │   └── options.css
│   ├── content/
│   │   └── content.ts         # Content script (runs on pages)
│   ├── background/
│   │   ├── background.html
│   │   └── background.ts      # Service worker
│   ├── services/
│   │   ├── speechService.ts   # Web Speech API wrapper
│   │   └── storageService.ts  # Chrome storage wrapper
│   ├── utils/
│   │   ├── textInjection.ts   # Text insertion logic
│   │   └── logger.ts          # Logging utility
│   └── types/
│       └── index.ts           # TypeScript types
├── tests/
│   ├── setup.ts               # Jest setup
│   ├── services/
│   │   └── speechService.test.ts
│   └── utils/
│       └── textInjection.test.ts
├── public/
│   └── icons/                 # Extension icons (create these)
├── vite.config.ts
├── tsconfig.json
├── jest.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js v18+ ([download here](https://nodejs.org))
- Google Chrome or Chromium-based browser

### 1. Clone or download the project

```bash
cd my-speech-extension
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

```bash
npm run build
```

This creates a `dist/` folder with your compiled extension.

### 4. Load extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from your project
5. The extension should appear in your toolbar!

### 5. Test the extension

- Click the microphone icon in your toolbar
- Click **Start Recording** button in the popup
- Speak clearly into your microphone
- Your speech should appear as text in the active input field

## Development Commands

```bash
# Build for production
npm run build

# Start development server (watches for changes)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

## How It Works

1. **User clicks microphone icon** → Popup opens
2. **User clicks "Start Recording"** → Extension requests microphone permission
3. **Browser captures audio** → Web Speech API processes speech in real-time
4. **Transcription appears** → Text is shown in popup as user speaks
5. **User clicks "Insert"** → Text is injected into the active input field on the page

## Supported Input Fields

- ✅ Text inputs (`<input type="text">`)
- ✅ Textareas (`<textarea>`)
- ✅ Contenteditable divs (Gmail, Slack, Twitter, etc.)
- ✅ Form fields with spellcheck enabled
- ✅ Modern web apps with custom input handlers

## Settings

Click the ⚙️ icon in the popup to access settings:

- **Language**: Choose transcription language (English, Spanish, French, etc.)
- **Keyboard Shortcut**: Customize recording hotkey
- **Keep History**: Toggle to save transcription history
- **Auto-insert**: Automatically insert text without confirmation

## Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Edge 90+
- ✅ Brave 1.20+
- ⚠️ Firefox (limited support, different API)

## Privacy & Security

- 🔒 **No data collection** — Audio is not stored or sent to servers
- 🔒 **Local processing** — Uses browser's built-in Web Speech API
- 🔒 **No analytics** — No tracking or telemetry
- 🔒 **Open source** — Code is transparent and auditable

## Troubleshooting

### Microphone not working
- Check Chrome permissions: `chrome://settings/content/microphone`
- Ensure microphone is connected and working
- Try reloading the extension

### Text not inserting
- Make sure the text field is focused (cursor is in the field)
- Some rich text editors may require specific handling (will be improved)
- Check browser console for errors (press `F12`)

### No transcription appearing
- Check that microphone is capturing audio (look for audio level indicator)
- Try a different language setting
- Ensure you're speaking clearly and at normal volume

## Future Features (Roadmap)

- [ ] OpenAI Whisper API fallback for improved accuracy
- [ ] Support for 50+ languages
- [ ] Transcription history with timestamps
- [ ] Edit and resubmit transcriptions before inserting
- [ ] Custom punctuation rules
- [ ] Dark mode for UI
- [ ] Offline mode support
- [ ] Firefox extension version

## Contributing

Found a bug or have a feature idea? Open an issue or submit a pull request!

## License

MIT - Feel free to use this extension however you'd like.

## Author

Created for seamless speech-to-text input across the web.

---

**Questions?** Check the [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/mv3/).
