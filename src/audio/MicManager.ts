/**
 * @fileoverview Handles microphone access, permissions, and audio buffer streaming.
 * @module audio/MicManager
 */

/**
 * Manages microphone access and audio stream capture.
 * 
 * Handles browser permissions, initializes MediaStream, and provides
 * access to raw audio data for processing via frame callbacks.
 * 
 * @example
 * ```typescript
 * const micManager = new MicManager();
 * 
 * micManager.onAudioFrame((buffer: Float32Array) => {
 *   console.log('Received audio frame:', buffer.length);
 * });
 * 
 * await micManager.start();
 * ```
 * 
 * @public
 */
export class MicManager {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioFrameCallbacks: Set<(buffer: Float32Array) => void> = new Set();
  private isRunning: boolean = false;

  /**
   * Creates a new MicManager instance.
   */
  constructor() {
    // Constructor is intentionally minimal
  }

  /**
   * Starts microphone access and begins streaming audio frames.
   * 
   * @throws {Error} If microphone access is denied or unavailable
   * @returns Promise that resolves when microphone is ready
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('MicManager is already running');
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new AudioContext();
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);

      // Create script processor for audio frame capture
      // Note: ScriptProcessorNode is deprecated but used here as placeholder
      // In production, consider using AudioWorkletNode
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.scriptProcessor.onaudioprocess = (event) => {
        if (this.isRunning) {
          const inputBuffer = event.inputBuffer;
          const channelData = inputBuffer.getChannelData(0);
          
          // Create Float32Array copy for callback
          const buffer = new Float32Array(channelData);
          
          // Notify all callbacks
          this.audioFrameCallbacks.forEach(callback => {
            try {
              callback(buffer);
            } catch (error) {
              console.error('Error in audio frame callback:', error);
            }
          });
        }
      };

      // Connect the audio pipeline
      this.mediaStreamSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.isRunning = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to access microphone: ${errorMessage}`);
    }
  }

  /**
   * Stops microphone access and releases resources.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    // Disconnect audio nodes
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRunning = false;
  }

  /**
   * Registers a callback to receive audio frames.
   * 
   * @param callback - Function called with each audio frame (Float32Array)
   */
  onAudioFrame(callback: (buffer: Float32Array) => void): void {
    this.audioFrameCallbacks.add(callback);
  }

  /**
   * Unregisters an audio frame callback.
   * 
   * @param callback - The callback function to remove
   */
  offAudioFrame(callback: (buffer: Float32Array) => void): void {
    this.audioFrameCallbacks.delete(callback);
  }

  /**
   * Gets the current MediaStream.
   * 
   * @returns The active MediaStream, or null if not initialized
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Gets the AudioContext for audio processing.
   * 
   * @returns The AudioContext, or null if not initialized
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Checks if microphone access is currently available.
   * 
   * @returns True if microphone is initialized and active
   */
  isInitialized(): boolean {
    return this.isRunning && this.stream !== null && this.stream.active;
  }
}
