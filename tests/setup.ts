// Jest setup file for configuring the test environment
// This runs before any tests are executed

// Mock chrome API for testing
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
  },
} as any;

// Mock Web Speech API
global.SpeechRecognition = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;

global.webkitSpeechRecognition = global.SpeechRecognition;

// Suppress console errors in tests (optional)
global.console.error = jest.fn();
global.console.warn = jest.fn();
