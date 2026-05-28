/**
 * Storage Service
 * Wrapper around chrome.storage.local for managing extension data
 * Handles settings, history, and user preferences
 */

export interface ExtensionSettings {
  language: string;
  keepHistory: boolean;
  historyDays: number;
  autoInsert: boolean;
  autoCapitalize: boolean;
  useWhisperAPI: boolean;
  whisperAPIKey?: string;
}

export interface TranscriptionHistory {
  id: string;
  timestamp: number;
  transcript: string;
  duration: number;
  language: string;
  confidence: number;
}

// Default settings
const DEFAULT_SETTINGS: ExtensionSettings = {
  language: 'en-US',
  keepHistory: false,
  historyDays: 7,
  autoInsert: true,
  autoCapitalize: true,
  useWhisperAPI: false,
};

/**
 * Get settings from storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error reading settings:', chrome.runtime.lastError);
        resolve(DEFAULT_SETTINGS);
        return;
      }

      const settings = result.settings || DEFAULT_SETTINGS;
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });
}

/**
 * Save settings to storage
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve, reject) => {
    getSettings().then((currentSettings) => {
      const updatedSettings = { ...currentSettings, ...settings };

      chrome.storage.local.set({ settings: updatedSettings }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving settings:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        resolve();
      });
    });
  });
}

/**
 * Reset settings to default
 */
export async function resetSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ settings: DEFAULT_SETTINGS }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve();
    });
  });
}

/**
 * Get single setting value
 */
export async function getSetting<K extends keyof ExtensionSettings>(
  key: K
): Promise<ExtensionSettings[K]> {
  const settings = await getSettings();
  return settings[key];
}

/**
 * Set single setting value
 */
export async function setSetting<K extends keyof ExtensionSettings>(
  key: K,
  value: ExtensionSettings[K]
): Promise<void> {
  const settings = await getSettings();
  return saveSettings({ ...settings, [key]: value });
}

/**
 * Add transcription to history
 */
export async function addToHistory(history: Omit<TranscriptionHistory, 'id'>): Promise<void> {
  return new Promise((resolve, reject) => {
    const settings = getSettings();

    settings.then((s) => {
      if (!s.keepHistory) {
        resolve();
        return;
      }

      chrome.storage.local.get('history', (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        let historyArray: TranscriptionHistory[] = result.history || [];

        // Add new entry
        const newEntry: TranscriptionHistory = {
          ...history,
          id: generateId(),
        };

        historyArray.unshift(newEntry);

        // Keep only recent history based on historyDays setting
        const cutoffTime = Date.now() - s.historyDays * 24 * 60 * 60 * 1000;
        historyArray = historyArray.filter((item) => item.timestamp > cutoffTime);

        // Limit to last 100 entries
        historyArray = historyArray.slice(0, 100);

        chrome.storage.local.set({ history: historyArray }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          resolve();
        });
      });
    });
  });
}

/**
 * Get transcription history
 */
export async function getHistory(): Promise<TranscriptionHistory[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('history', (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error reading history:', chrome.runtime.lastError);
        resolve([]);
        return;
      }

      resolve(result.history || []);
    });
  });
}

/**
 * Clear transcription history
 */
export async function clearHistory(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ history: [] }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve();
    });
  });
}

/**
 * Delete single history entry
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('history', (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      const historyArray: TranscriptionHistory[] = result.history || [];
      const filteredHistory = historyArray.filter((item) => item.id !== id);

      chrome.storage.local.set({ history: filteredHistory }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        resolve();
      });
    });
  });
}

/**
 * Clear all data (settings and history)
 */
export async function clearAllData(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve();
    });
  });
}

/**
 * Export all data as JSON
 */
export async function exportData(): Promise<{
  settings: ExtensionSettings;
  history: TranscriptionHistory[];
  exportedAt: string;
}> {
  const settings = await getSettings();
  const history = await getHistory();

  return {
    settings,
    history,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Generate unique ID for history entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Listen for storage changes (useful for syncing across popup/options)
 */
export function onStorageChange(
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      callback(changes);
    }
  });
}

/**
 * Get storage usage information
 */
export async function getStorageInfo(): Promise<{
  bytesInUse: number;
  quota: number;
  percentUsed: number;
}> {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
      const quota = chrome.storage.local.QUOTA_BYTES || 10 * 1024 * 1024; // 10MB default
      const percentUsed = (bytesInUse / quota) * 100;

      resolve({
        bytesInUse,
        quota,
        percentUsed,
      });
    });
  });
}
