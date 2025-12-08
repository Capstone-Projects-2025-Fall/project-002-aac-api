/**
 * @fileoverview Main entry point for the AAC SDK. Manages event subscriptions,
 * audio pipeline initialization, and coordinates the audio → ASR → intent flow.
 * @module core/AACClient
 */

import { AACClientConfig, AudioEvent, AudioEventCallback, Intent, IntentCallback } from '../types';
import { MicManager } from '../audio/MicManager';
import { PipelineManager } from '../pipeline/PipelineManager';
import { BrowserASRAdapter } from '../asr/BrowserASRAdapter';
import { RemoteASRAdapter } from '../asr/RemoteASRAdapter';
import { Logger } from '../middleware/Logger';
import { CacheManager } from '../middleware/CacheManager';

/**
 * Main client class for the AAC SDK.
 * 
 * Provides an event-driven API for handling audio input, voice recognition,
 * and intent parsing for game integration.
 * 
 * @example
 * ```typescript
 * const client = new AACClient({
 *   enableNoiseFilter: true,
 *   enableCache: true,
 *   asrAdapter: 'browser'
 * });
 * 
 * client.onIntent((intent) => {
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
  private pipelineManager: PipelineManager;
  private logger?: Logger;
  private cacheManager?: CacheManager;
  private eventCallbacks: Set<AudioEventCallback> = new Set();
  private intentCallbacks: Set<IntentCallback> = new Set();
  private isRunning: boolean = false;

  /**
   * Creates a new AACClient instance.
   * 
   * @param config - Configuration options for the client
   */
  constructor(private config: AACClientConfig = {}) {
    this.micManager = new MicManager();
    
    // Initialize ASR adapter based on config
    const asrAdapter = config.asrAdapter === 'remote' 
      ? new RemoteASRAdapter(config.asrEndpoint)
      : new BrowserASRAdapter();
    
    this.pipelineManager = new PipelineManager(asrAdapter, {
      enableNoiseFilter: config.enableNoiseFilter ?? false
    });

    if (config.enableLogging) {
      this.logger = new Logger();
    }

    if (config.enableCache) {
      this.cacheManager = new CacheManager();
    }
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
      await this.micManager.initialize();
      this.pipelineManager.start(this.handlePipelineEvent.bind(this));
      this.isRunning = true;
      this.logger?.log('AACClient started');
    } catch (error) {
      this.emitError('Failed to start AACClient', error);
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

    this.pipelineManager.stop();
    this.micManager.cleanup();
    this.isRunning = false;
    this.logger?.log('AACClient stopped');
  }

  /**
   * Subscribes to all audio events.
   * 
   * @param callback - Function to call when any audio event occurs
   */
  onEvent(callback: AudioEventCallback): void {
    this.eventCallbacks.add(callback);
  }

  /**
   * Unsubscribes from audio events.
   * 
   * @param callback - The callback function to remove
   */
  offEvent(callback: AudioEventCallback): void {
    this.eventCallbacks.delete(callback);
  }

  /**
   * Subscribes to intent events specifically.
   * 
   * @param callback - Function to call when an intent is recognized
   */
  onIntent(callback: IntentCallback): void {
    this.intentCallbacks.add(callback);
  }

  /**
   * Unsubscribes from intent events.
   * 
   * @param callback - The callback function to remove
   */
  offIntent(callback: IntentCallback): void {
    this.intentCallbacks.delete(callback);
  }

  /**
   * Handles events from the pipeline and distributes them to subscribers.
   * 
   * @private
   */
  private handlePipelineEvent(event: AudioEvent): void {
    // Check cache if enabled
    if (this.cacheManager && event.type === 'intent') {
      const cached = this.cacheManager.get(event);
      if (cached) {
        // Use cached result
        return;
      }
    }

    // Emit to all event subscribers
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        this.emitError('Error in event callback', error);
      }
    });

    // Emit to intent subscribers if this is an intent event
    if (event.type === 'intent' && 'intent' in event) {
      this.intentCallbacks.forEach(callback => {
        try {
          callback(event.intent);
        } catch (error) {
          this.emitError('Error in intent callback', error);
        }
      });

      // Cache the intent if caching is enabled
      if (this.cacheManager) {
        this.cacheManager.set(event);
      }
    }

    this.logger?.log('Event emitted', { type: event.type });
  }

  /**
   * Emits an error event.
   * 
   * @private
   */
  private emitError(message: string, error?: unknown): void {
    const errorEvent: AudioEvent = {
      type: 'error',
      timestamp: Date.now(),
      data: {
        message,
        error: error instanceof Error ? error.message : String(error)
      }
    };
    this.handlePipelineEvent(errorEvent);
  }

  /**
   * Gets the current running state of the client.
   * 
   * @returns True if the client is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

