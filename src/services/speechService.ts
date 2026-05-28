/**
 * Speech Recognition Service
 * Wrapper around the Web Speech API (SpeechRecognition)
 * Handles microphone access, speech processing, and transcription
 */

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface SpeechServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface SpeechServiceOptions {
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private config: Required<SpeechServiceConfig>;
  private options: SpeechServiceOptions = {};

  constructor(config: SpeechServiceConfig = {}) {
    this.config = {
      language: config.language || 'en-US',
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives || 1,
    };

    this.initializeRecognition();
  }

  /**
   * Initialize the Web Speech API
   */
  private initializeRecognition(): void {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.options.onError?.('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.setupRecognitionListeners();
  }

  /**
   * Setup event listeners for the recognition instance
   */
  private setupRecognitionListeners(): void {
    if (!this.recognition) return;

    // When speech recognition starts
    this.recognition.onstart = () => {
      this.isListening = true;
      this.options.onStart?.();
    };

    // When speech recognition ends
    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd?.();
    };

    // When a result is available
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      let isFinal = false;
      let confidence = 0;

      // Iterate through results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        transcript += transcriptSegment;
        confidence = event.results[i][0].confidence;
        isFinal = event.results[i].isFinal;
      }

      const result: SpeechRecognitionResult = {
        transcript: transcript.trim(),
        isFinal,
        confidence,
        timestamp: Date.now(),
      };

      this.options.onResult?.(result);
    };

    // When an error occurs
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = this.mapErrorToMessage(event.error);
      this.options.onError?.(errorMessage);
      this.isListening = false;
    };
  }

  /**
   * Start listening for speech
   */
  public start(options?: SpeechServiceOptions): void {
    if (!this.recognition) {
      console.error('Speech Recognition API not initialized');
      return;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    // Update options if provided
    if (options) {
      this.options = { ...this.options, ...options };
    }

    // Configure recognition
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      // In some cases, start() throws if already starting
      // This is normal behavior, just log it
    }
  }

  /**
   * Stop listening for speech
   */
  public stop(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  /**
   * Abort speech recognition immediately
   */
  public abort(): void {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.isListening = false;
      this.options.onEnd?.();
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
    }
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Set the language for recognition
   */
  public setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Get the current language setting
   */
  public getLanguage(): string {
    return this.config.language;
  }

  /**
   * Set configuration options
   */
  public setConfig(config: Partial<SpeechServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if Speech Recognition API is supported
   */
  public static isSupported(): boolean {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    return !!SpeechRecognitionAPI;
  }

  /**
   * Map error codes to user-friendly messages
   */
  private mapErrorToMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'no-speech': 'No speech was detected. Please speak louder or move closer to your microphone.',
      'audio-capture': 'No microphone was found. Ensure it is connected.',
      'network': 'Network error. Please check your internet connection.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'permission-denied': 'Microphone permission denied.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'aborted': 'Speech recognition was aborted.',
    };

    return errorMap[error] || `Speech recognition error: ${error}`;
  }
}

/**
 * Global instance of SpeechService
 * Use this for consistent speech recognition across the extension
 */
export const globalSpeechService = new SpeechService();
