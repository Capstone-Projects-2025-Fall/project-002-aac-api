/**
 * @fileoverview Coordinates the audio → ASR → intent processing flow.
 * @module pipeline/PipelineManager
 */

import { ASRAdapter } from '../asr/BrowserASRAdapter';
import { IntentInterpreter } from './IntentInterpreter';
import { AudioEvent, IntentEvent, TranscriptEvent } from '../types';
import { NoiseFilter } from '../audio/NoiseFilter';

/**
 * Configuration for the pipeline manager.
 * 
 * @public
 */
export interface PipelineManagerConfig {
  /** Enable noise filtering */
  enableNoiseFilter?: boolean;
  /** Intent interpreter configuration */
  intentConfig?: import('./IntentInterpreter').IntentInterpreterConfig;
}

/**
 * Manages the audio processing pipeline from input to intent.
 * 
 * Coordinates the flow: Audio → ASR → Intent Interpreter → Events.
 * Handles audio capture, speech recognition, intent parsing, and event emission.
 * 
 * @example
 * ```typescript
 * const adapter = new BrowserASRAdapter();
 * const manager = new PipelineManager(adapter, {
 *   enableNoiseFilter: true
 * });
 * 
 * manager.start((event) => {
 *   if (event.type === 'intent') {
 *     console.log('Intent:', event.intent);
 *   }
 * });
 * ```
 * 
 * @public
 */
export class PipelineManager {
  private interpreter: IntentInterpreter;
  private noiseFilter?: NoiseFilter;
  private eventCallback?: (event: AudioEvent) => void;
  private isRunning: boolean = false;

  /**
   * Creates a new PipelineManager instance.
   * 
   * @param asrAdapter - ASR adapter to use for speech recognition
   * @param config - Configuration options
   */
  constructor(
    private asrAdapter: ASRAdapter,
    config: PipelineManagerConfig = {}
  ) {
    this.interpreter = new IntentInterpreter(config.intentConfig);
    
    if (config.enableNoiseFilter) {
      this.noiseFilter = new NoiseFilter();
    }
  }

  /**
   * Starts the processing pipeline.
   * 
   * @param onEvent - Callback for pipeline events
   */
  start(onEvent: (event: AudioEvent) => void): void {
    if (this.isRunning) {
      return;
    }

    this.eventCallback = onEvent;
    this.isRunning = true;

    // Start ASR adapter
    this.asrAdapter.start(
      (transcriptEvent: TranscriptEvent) => this.handleTranscript(transcriptEvent),
      (error: Error) => this.handleError(error)
    );

    this.emitEvent({
      type: 'audio-start',
      timestamp: Date.now()
    });
  }

  /**
   * Stops the processing pipeline.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.asrAdapter.stop();
    this.isRunning = false;

    this.emitEvent({
      type: 'audio-end',
      timestamp: Date.now()
    });
  }

  /**
   * Handles transcript events from ASR.
   * 
   * @private
   */
  private handleTranscript(event: TranscriptEvent): void {
    // Emit transcript event
    this.emitEvent(event);

    // Interpret transcript as intent
    const intent = this.interpreter.interpret(event.transcript, event.confidence);

    if (intent) {
      const intentEvent: IntentEvent = {
        type: 'intent',
        timestamp: Date.now(),
        intent,
        confidence: intent.confidence
      };
      this.emitEvent(intentEvent);
    }
  }

  /**
   * Handles errors from ASR adapter.
   * 
   * @private
   */
  private handleError(error: Error): void {
    this.emitEvent({
      type: 'error',
      timestamp: Date.now(),
      data: {
        message: error.message,
        code: 'ASR_ERROR'
      }
    });
  }

  /**
   * Emits an event to the registered callback.
   * 
   * @private
   */
  private emitEvent(event: AudioEvent): void {
    if (this.eventCallback) {
      this.eventCallback(event);
    }
  }

  /**
   * Checks if the pipeline is currently running.
   * 
   * @returns True if pipeline is active
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Gets the intent interpreter instance.
   * 
   * @returns The IntentInterpreter instance
   */
  getInterpreter(): IntentInterpreter {
    return this.interpreter;
  }
}

