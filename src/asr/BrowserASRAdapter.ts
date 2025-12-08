/**
 * @fileoverview Browser-based ASR adapter using Web Speech API.
 * @module asr/BrowserASRAdapter
 */

import { AudioEvent, TranscriptEvent } from '../types';

/**
 * Interface for ASR adapters.
 * 
 * @public
 */
export interface ASRAdapter {
  /**
   * Starts speech recognition.
   * 
   * @param onTranscript - Callback for transcript events
   * @param onError - Callback for error events
   */
  start(onTranscript: (event: TranscriptEvent) => void, onError: (error: Error) => void): void;

  /**
   * Stops speech recognition.
   */
  stop(): void;

  /**
   * Checks if the adapter is currently running.
   * 
   * @returns True if recognition is active
   */
  isRunning(): boolean;
}

/**
 * Browser-based ASR adapter using the Web Speech API.
 * 
 * Provides speech recognition capabilities using the browser's built-in
 * SpeechRecognition API (Chrome) or webkitSpeechRecognition (Safari).
 * 
 * @example
 * ```typescript
 * const adapter = new BrowserASRAdapter();
 * adapter.start(
 *   (event) => console.log('Transcript:', event.transcript),
 *   (error) => console.error('Error:', error)
 * );
 * ```
 * 
 * @public
 */
export class BrowserASRAdapter implements ASRAdapter {
  private recognition: SpeechRecognition | null = null;
  private isActive: boolean = false;

  /**
   * Creates a new BrowserASRAdapter instance.
   */
  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  /**
   * Starts speech recognition.
   * 
   * @param onTranscript - Callback for transcript events
   * @param onError - Callback for error events
   * @throws {Error} If SpeechRecognition API is not available
   */
  start(onTranscript: (event: TranscriptEvent) => void, onError: (error: Error) => void): void {
    if (!this.recognition) {
      throw new Error('SpeechRecognition API is not available in this browser');
    }

    if (this.isActive) {
      return;
    }

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcriptEvent: TranscriptEvent = {
          type: 'transcript',
          timestamp: Date.now(),
          transcript: result[0].transcript,
          confidence: result[0].confidence || 0.8
        };
        onTranscript(transcriptEvent);
      }
    };

    this.recognition.onerror = (event) => {
      onError(new Error(`Speech recognition error: ${event.error}`));
    };

    this.recognition.onend = () => {
      this.isActive = false;
    };

    this.recognition.start();
    this.isActive = true;
  }

  /**
   * Stops speech recognition.
   */
  stop(): void {
    if (this.recognition && this.isActive) {
      this.recognition.stop();
      this.isActive = false;
    }
  }

  /**
   * Checks if the adapter is currently running.
   * 
   * @returns True if recognition is active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Sets the language for speech recognition.
   * 
   * @param lang - Language code (e.g., 'en-US', 'es-ES')
   */
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Gets the current language setting.
   * 
   * @returns Current language code
   */
  getLanguage(): string {
    return this.recognition?.lang || 'en-US';
  }
}

