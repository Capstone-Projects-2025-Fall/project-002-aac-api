/**
 * @fileoverview Handles microphone access, permissions, and audio stream management.
 * @module audio/MicManager
 */

/**
 * Manages microphone access and audio stream capture.
 * 
 * Handles browser permissions, initializes MediaStream, and provides
 * access to raw audio data for processing.
 * 
 * @example
 * ```typescript
 * const micManager = new MicManager();
 * await micManager.initialize();
 * const stream = micManager.getStream();
 * ```
 * 
 * @public
 */
export class MicManager {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;

  /**
   * Initializes microphone access and creates audio stream.
   * 
   * @throws {Error} If microphone access is denied or unavailable
   * @returns Promise that resolves when microphone is ready
   */
  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext();
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);
    } catch (error) {
      throw new Error(`Failed to access microphone: ${error instanceof Error ? error.message : String(error)}`);
    }
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
   * Gets the MediaStreamAudioSourceNode for connecting to audio processors.
   * 
   * @returns The MediaStreamAudioSourceNode, or null if not initialized
   */
  getMediaStreamSource(): MediaStreamAudioSourceNode | null {
    return this.mediaStreamSource;
  }

  /**
   * Releases microphone resources and stops all tracks.
   */
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaStreamSource = null;
  }

  /**
   * Checks if microphone access is currently available.
   * 
   * @returns True if microphone is initialized and active
   */
  isInitialized(): boolean {
    return this.stream !== null && this.stream.active;
  }
}

