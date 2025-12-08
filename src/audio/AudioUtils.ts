/**
 * @fileoverview Helper functions for audio buffer manipulation, normalization, and utilities.
 * @module audio/AudioUtils
 */

/**
 * Utility functions for audio processing and manipulation.
 * 
 * @public
 */
export class AudioUtils {
  /**
   * Converts an AudioBuffer to a Float32Array.
   * 
   * @param buffer - Audio buffer to convert
   * @returns Float32Array representation of the audio data
   */
  static bufferToFloat32Array(buffer: AudioBuffer): Float32Array {
    const channelData = buffer.getChannelData(0);
    return new Float32Array(channelData);
  }

  /**
   * Calculates the RMS (Root Mean Square) level of an audio buffer.
   * 
   * @param buffer - Audio buffer to analyze
   * @returns RMS level (0-1)
   */
  static calculateRMS(buffer: AudioBuffer): number {
    const channelData = buffer.getChannelData(0);
    let sum = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    
    return Math.sqrt(sum / channelData.length);
  }

  /**
   * Calculates the peak level of an audio buffer.
   * 
   * @param buffer - Audio buffer to analyze
   * @returns Peak level (0-1)
   */
  static calculatePeak(buffer: AudioBuffer): number {
    const channelData = buffer.getChannelData(0);
    let peak = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }
    
    return peak;
  }

  /**
   * Checks if audio buffer contains silence based on RMS threshold.
   * 
   * @param buffer - Audio buffer to check
   * @param threshold - RMS threshold below which audio is considered silent
   * @returns True if buffer is considered silent
   */
  static isSilent(buffer: AudioBuffer, threshold: number = 0.01): boolean {
    return this.calculateRMS(buffer) < threshold;
  }

  /**
   * Merges multiple audio buffers into a single buffer.
   * 
   * @param buffers - Array of audio buffers to merge
   * @returns Merged audio buffer
   */
  static mergeBuffers(buffers: AudioBuffer[]): AudioBuffer {
    if (buffers.length === 0) {
      throw new Error('Cannot merge empty buffer array');
    }

    const firstBuffer = buffers[0];
    const sampleRate = firstBuffer.sampleRate;
    const numberOfChannels = firstBuffer.numberOfChannels;
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);

    const audioContext = new AudioContext({ sampleRate });
    const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

    let offset = 0;
    for (const buffer of buffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const mergedData = mergedBuffer.getChannelData(channel);
        const bufferData = buffer.getChannelData(channel);
        mergedData.set(bufferData, offset);
      }
      offset += buffer.length;
    }

    return mergedBuffer;
  }

  /**
   * Trims silence from the beginning and end of an audio buffer.
   * 
   * @param buffer - Audio buffer to trim
   * @param threshold - RMS threshold for silence detection
   * @returns Trimmed audio buffer
   */
  static trimSilence(buffer: AudioBuffer, threshold: number = 0.01): AudioBuffer {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const frameSize = Math.floor(sampleRate * 0.01); // 10ms frames
    
    let startIndex = 0;
    let endIndex = channelData.length;

    // Find start of audio
    for (let i = 0; i < channelData.length - frameSize; i += frameSize) {
      const frame = channelData.slice(i, i + frameSize);
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      if (rms >= threshold) {
        startIndex = i;
        break;
      }
    }

    // Find end of audio
    for (let i = channelData.length - frameSize; i >= 0; i -= frameSize) {
      const frame = channelData.slice(i, i + frameSize);
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      if (rms >= threshold) {
        endIndex = i + frameSize;
        break;
      }
    }

    if (startIndex >= endIndex) {
      return buffer; // No trimming needed
    }

    const audioContext = new AudioContext({ sampleRate });
    const trimmedBuffer = audioContext.createBuffer(
      buffer.numberOfChannels,
      endIndex - startIndex,
      sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const trimmedData = trimmedBuffer.getChannelData(channel);
      const originalData = buffer.getChannelData(channel);
      trimmedData.set(originalData.slice(startIndex, endIndex));
    }

    return trimmedBuffer;
  }
}

