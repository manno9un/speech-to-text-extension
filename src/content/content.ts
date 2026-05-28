/**
 * Content Script
 * Runs inside every web page.
 * Responsibilities:
 *   - Host the Web Speech API recognition (more reliable here than in the popup)
 *   - Remember which input field the user had focused
 *   - Inject transcribed text into that field
 *   - Communicate with the popup/background via chrome.runtime messages
 */

import { SpeechService, SpeechRecognitionResult } from '@services/speechService';
import { insertTextAtCursor, getActiveInputElement } from '@utils/textInjection';
import { logger } from '@utils/logger';

// ---------------------------------------------------------------------------
// Message contract between popup/background and this content script.
// Kept local (not imported) so the content script is self-contained.
// ---------------------------------------------------------------------------
interface ContentMessage {
  type:
    | 'PING'
    | 'START_RECORDING'
    | 'STOP_RECORDING'
    | 'INSERT_TEXT'
    | 'GET_FIELD_STATUS';
  payload?: {
    language?: string;
    text?: string;
    autoInsert?: boolean;
  };
}

interface ContentResponse {
  ok: boolean;
  error?: string;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let speechService: SpeechService | null = null;

// The field the user had focused when they started recording. We capture this
// because opening the popup can move focus away from the page.
let targetField: HTMLElement | null = null;

// Accumulated final transcript for the current recording session.
let sessionTranscript = '';

// Whether to insert text live as it is recognized, or wait for STOP.
let autoInsert = true;

// ---------------------------------------------------------------------------
// Focus tracking
// We listen for focus changes so that when the user clicks an input and then
// opens the popup, we still know where the text should go.
// ---------------------------------------------------------------------------
let lastFocusedField: HTMLElement | null = null;

document.addEventListener(
  'focusin',
  (event) => {
    const el = event.target as HTMLElement;
    if (isEditable(el)) {
      lastFocusedField = el;
    }
  },
  true
);

function isEditable(el: HTMLElement | null): boolean {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'textarea') return true;
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type?.toLowerCase();
    return ['text', 'email', 'search', 'url', 'tel', ''].includes(type);
  }
  return el.isContentEditable;
}

// Resolve the best target field: the currently active one, or the last one we
// saw focused before the popup stole focus.
function resolveTargetField(): HTMLElement | null {
  return getActiveInputElement() || lastFocusedField;
}

// ---------------------------------------------------------------------------
// Recording lifecycle
// ---------------------------------------------------------------------------
function startRecording(language: string, insertLive: boolean): ContentResponse {
  if (!SpeechService.isSupported()) {
    return { ok: false, error: 'Speech recognition is not supported in this browser.' };
  }

  targetField = resolveTargetField();
  if (!targetField) {
    return {
      ok: false,
      error: 'Click into a text field first, then start recording.',
    };
  }

  autoInsert = insertLive;
  sessionTranscript = '';

  speechService = new SpeechService({
    language,
    continuous: true,
    interimResults: true,
  });

  speechService.start({
    onStart: () => {
      logger.info('Recording started', { language });
      sendRuntimeMessage({ type: 'RECORDING_STARTED' });
    },
    onResult: (result: SpeechRecognitionResult) => {
      handleResult(result);
    },
    onError: (error: string) => {
      logger.error('Recognition error', error);
      sendRuntimeMessage({ type: 'RECORDING_ERROR', payload: { error } });
    },
    onEnd: () => {
      logger.info('Recording ended');
      sendRuntimeMessage({
        type: 'RECORDING_ENDED',
        payload: { transcript: sessionTranscript },
      });
    },
  });

  return { ok: true };
}

function stopRecording(): ContentResponse {
  if (speechService) {
    speechService.stop();
  }

  // If we were not inserting live, insert the whole transcript now.
  if (!autoInsert && sessionTranscript.trim() && targetField) {
    insertTextAtCursor(sessionTranscript.trim(), targetField, { triggerEvents: true });
  }

  return { ok: true, data: { transcript: sessionTranscript } };
}

function handleResult(result: SpeechRecognitionResult): void {
  // Always forward to the popup so it can show live feedback.
  sendRuntimeMessage({
    type: 'TRANSCRIPT_UPDATE',
    payload: {
      transcript: result.transcript,
      isFinal: result.isFinal,
    },
  });

  if (!result.isFinal) {
    return;
  }

  // Final chunk: accumulate it.
  const chunk = result.transcript.trim();
  if (!chunk) return;

  sessionTranscript = sessionTranscript ? `${sessionTranscript} ${chunk}` : chunk;

  // Insert live if enabled.
  if (autoInsert && targetField) {
    const inserted = insertTextAtCursor(chunk, targetField, { triggerEvents: true });
    if (!inserted) {
      logger.warn('Live insertion failed; will rely on final insert.');
    }
  }
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
function sendRuntimeMessage(message: { type: string; payload?: unknown }): void {
  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup may be closed; that's fine, ignore.
    });
  } catch {
    // No receiver; ignore.
  }
}

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse: (r: ContentResponse) => void) => {
    switch (message.type) {
      case 'PING':
        sendResponse({ ok: true, data: 'content-script-alive' });
        break;

      case 'START_RECORDING':
        sendResponse(
          startRecording(
            message.payload?.language || 'en-US',
            message.payload?.autoInsert ?? true
          )
        );
        break;

      case 'STOP_RECORDING':
        sendResponse(stopRecording());
        break;

      case 'INSERT_TEXT': {
        const text = message.payload?.text || '';
        const field = resolveTargetField();
        if (!field) {
          sendResponse({ ok: false, error: 'No text field is focused.' });
          break;
        }
        const ok = insertTextAtCursor(text, field, { triggerEvents: true });
        sendResponse({ ok });
        break;
      }

      case 'GET_FIELD_STATUS': {
        const field = resolveTargetField();
        sendResponse({
          ok: true,
          data: { hasField: !!field, tag: field?.tagName?.toLowerCase() || null },
        });
        break;
      }

      default:
        sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
    }

    // Returning true would keep the channel open for async responses.
    // All our responses above are synchronous, so we return false implicitly.
    return false;
  }
);

logger.info('Speech-to-text content script loaded.');
