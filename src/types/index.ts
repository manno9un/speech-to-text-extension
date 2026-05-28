/**
 * Type Definitions
 * Shared types used across the extension
 */

/**
 * Message types sent between background/content/popup
 */
export type MessageType =
  | 'start_recording'
  | 'stop_recording'
  | 'text_inserted'
  | 'get_settings'
  | 'save_settings'
  | 'add_history'
  | 'get_history'
  | 'error';

export interface ExtensionMessage {
  type: MessageType;
  data?: unknown;
  timestamp?: number;
}

/**
 * Response from extension message
 */
export interface ExtensionMessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Recording state
 */
export enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  ERROR = 'error',
}

/**
 * Popup component state
 */
export interface PopupState {
  isRecording: boolean;
  recordingState: RecordingState;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  language: string;
  confidence: number;
  duration: number;
  isLoading: boolean;
}

/**
 * Options component state
 */
export interface OptionsState {
  settings: {
    language: string;
    keepHistory: boolean;
    historyDays: number;
    autoInsert: boolean;
    autoCapitalize: boolean;
    useWhisperAPI: boolean;
    whisperAPIKey?: string;
  };
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  history: {
    id: string;
    transcript: string;
    timestamp: number;
    duration: number;
  }[];
}

/**
 * Available languages for speech recognition
 */
export const AVAILABLE_LANGUAGES = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ru-RU': 'Russian',
  'ja-JP': 'Japanese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ko-KR': 'Korean',
  'ar-SA': 'Arabic',
  'hi-IN': 'Hindi',
  'nl-NL': 'Dutch',
  'pl-PL': 'Polish',
  'tr-TR': 'Turkish',
  'vi-VN': 'Vietnamese',
  'id-ID': 'Indonesian',
};

export type LanguageCode = keyof typeof AVAILABLE_LANGUAGES;

/**
 * Extension errors
 */
export enum ExtensionError {
  MICROPHONE_NOT_AVAILABLE = 'MICROPHONE_NOT_AVAILABLE',
  SPEECH_API_NOT_SUPPORTED = 'SPEECH_API_NOT_SUPPORTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SPEECH_DETECTED = 'NO_SPEECH_DETECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  TEXT_INJECTION_FAILED = 'TEXT_INJECTION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Event emitter type
 */
export type EventCallback<T = unknown> = (data: T) => void;

/**
 * Keyboard shortcut command
 */
export interface CommandEvent {
  command: string;
  timestamp: number;
}
