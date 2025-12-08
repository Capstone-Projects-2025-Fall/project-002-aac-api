/**
 * @fileoverview Main entry point for the AAC SDK. Manages event subscriptions,
 * audio pipeline initialization, and coordinates the audio → ASR → intent flow.
 * @module core/AACClient
 */

import { AACClientConfig, AACEvent, Intent, ErrorObject } from '../types';
import { MicManager } from '../audio/MicManager';
import { NoiseFilter } from '../audio/NoiseFilter';

/**
 * Main client class for the AAC SDK.
 * 
 * Provides an event-driven API for handling audio input, voice recognition,
 * and intent parsing for game integration.
 * 
 * @example
 * ```typescript
 * const client = new AACClient({
 *   asrAdapter: 'browser',
 *   confidenceThreshold: 0.8,
 *   inputType: 'free'
 * });
 * 
 * client.subscribe('onIntent', (intent) => {
 *   console.log('Received intent:', intent.action);
 * });
 * 
 * await client.start();
 * ```
 * 
 * @public
 */
export class AACClient {
  private micManager: MicManager;
  private noiseFilter: NoiseFilter;
  private eventSubscribers: Map<AACEvent, Set<Function>> = new Map();
  private isRunning: boolean = false;
  private config: AACClientConfig;

  /**
   * Creates a new AACClient instance.
   * 
   * @param config - Configuration options for the client
   */
  constructor(config: AACClientConfig = {}) {
    this.config = {
      asrAdapter: config.asrAdapter || 'browser',
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      inputType: config.inputType || 'free'
    };

    this.micManager = new MicManager();
    this.noiseFilter = new NoiseFilter();

    // Initialize event subscriber maps
    this.eventSubscribers.set('onTranscript', new Set());
    this.eventSubscribers.set('onIntent', new Set());
    this.eventSubscribers.set('onError', new Set());

    // Set up audio frame processing pipeline
    this.setupPipeline();
  }

  /**
   * Sets up the audio processing pipeline.
   * 
   * Pipeline: MicManager → NoiseFilter → ASR → IntentInterpreter
   * 
   * @private
   */
  private setupPipeline(): void {
    this.micManager.onAudioFrame((buffer: Float32Array) => {
      try {
        // Process through noise filter
        const filteredBuffer = this.noiseFilter.process(buffer);

        // TODO: Process through ASR adapter (placeholder)
        // const transcript = await this.processASR(filteredBuffer);
        // this.emit('onTranscript', transcript);

        // TODO: Process through intent interpreter (placeholder)
        // const intent = await this.processIntent(transcript);
        // if (intent && intent.confidence >= this.config.confidenceThreshold) {
        //   this.emit('onIntent', intent);
        // }
      } catch (error) {
        this.emitError('PIPELINE_ERROR', error instanceof Error ? error.message : String(error));
      }
    });
  }

  /**
   * Starts the audio pipeline and begins listening for input.
   * 
   * @throws {Error} If microphone access is denied or unavailable
   * @returns Promise that resolves when the client is ready
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('AACClient is already running');
    }

    try {
      await this.micManager.start();
      this.isRunning = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('START_ERROR', errorMessage);
      throw error;
    }
  }

  /**
   * Stops the audio pipeline and releases resources.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    try {
      this.micManager.stop();
      this.isRunning = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('STOP_ERROR', errorMessage);
    }
  }

  /**
   * Subscribes to an AAC event.
   * 
   * @param event - The event type to subscribe to
   * @param callback - Function to call when the event occurs
   * 
   * @example
   * ```typescript
   * client.subscribe('onTranscript', (transcript: string) => {
   *   console.log('Transcript:', transcript);
   * });
   * 
   * client.subscribe('onIntent', (intent: Intent) => {
   *   console.log('Intent:', intent.action);
   * });
   * 
   * client.subscribe('onError', (error: ErrorObject) => {
   *   console.error('Error:', error.message);
   * });
   * ```
   */
  subscribe(event: AACEvent, callback: Function): void {
    const subscribers = this.eventSubscribers.get(event);
    if (subscribers) {
      subscribers.add(callback);
    }
  }

  /**
   * Unsubscribes from an AAC event.
   * 
   * @param event - The event type to unsubscribe from
   * @param callback - The callback function to remove
   */
  unsubscribe(event: AACEvent, callback: Function): void {
    const subscribers = this.eventSubscribers.get(event);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Emits an event to all subscribers.
   * 
   * @private
   */
  private emit(event: AACEvent, data: unknown): void {
    const subscribers = this.eventSubscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Prevent callback errors from breaking the pipeline
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  /**
   * Emits an error event.
   * 
   * @private
   */
  private emitError(code: string, message: string): void {
    const error: ErrorObject = { code, message };
    this.emit('onError', error);
  }

  /**
   * Gets the current running state of the client.
   * 
   * @returns True if the client is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Gets the current configuration.
   * 
   * @returns Current configuration object
   */
  getConfig(): AACClientConfig {
    return { ...this.config };
  }
}
