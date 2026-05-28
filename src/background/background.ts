/**
 * Background Service Worker (Manifest V3)
 * Responsibilities:
 *   - Listen for the keyboard shortcut command and relay it
 *   - Set sensible defaults on install
 *   - Act as a lightweight coordinator (the content script does the heavy lifting)
 *
 * Note: under Manifest V3 this is a service worker, not a persistent page.
 * It can be torn down when idle and restarted on demand, so we keep no
 * important state in memory here.
 */

// Track recording state per-tab so the keyboard shortcut can toggle.
const recordingTabs = new Set<number>();

// ---------------------------------------------------------------------------
// On install: set default settings if none exist.
// ---------------------------------------------------------------------------
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get('settings');
  if (!existing.settings) {
    await chrome.storage.local.set({
      settings: {
        language: 'en-US',
        keepHistory: false,
        historyDays: 7,
        autoInsert: true,
        autoCapitalize: true,
        useWhisperAPI: false,
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Keyboard shortcut handler (Ctrl+Shift+S / Cmd+Shift+S)
// Toggles recording in the active tab by messaging its content script.
// ---------------------------------------------------------------------------
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-recording') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const tabId = tab.id;
  const isRecording = recordingTabs.has(tabId);

  // Load the user's language preference.
  const { settings } = await chrome.storage.local.get('settings');
  const language = settings?.language || 'en-US';
  const autoInsert = settings?.autoInsert ?? true;

  try {
    if (isRecording) {
      await chrome.tabs.sendMessage(tabId, { type: 'STOP_RECORDING' });
      recordingTabs.delete(tabId);
    } else {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'START_RECORDING',
        payload: { language, autoInsert },
      });
      if (response?.ok) {
        recordingTabs.add(tabId);
      }
    }
  } catch (error) {
    // Content script may not be injected on this page (e.g. chrome:// pages).
    console.warn('Could not toggle recording on this tab:', error);
  }
});

// ---------------------------------------------------------------------------
// Relay messages from content script back to the popup if it's open.
// The popup listens directly via chrome.runtime.onMessage, so the background
// mainly needs to keep its per-tab recording flag in sync.
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id;

  if (message?.type === 'RECORDING_ENDED' && tabId !== undefined) {
    recordingTabs.delete(tabId);
  }
  if (message?.type === 'RECORDING_ERROR' && tabId !== undefined) {
    recordingTabs.delete(tabId);
  }

  // We don't need to send a response here.
  return false;
});

// ---------------------------------------------------------------------------
// Clean up state when a tab is closed.
// ---------------------------------------------------------------------------
chrome.tabs.onRemoved.addListener((tabId) => {
  recordingTabs.delete(tabId);
});
