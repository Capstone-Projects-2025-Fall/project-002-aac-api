/**
 * @fileoverview Unit tests for NoiseFilter.
 */

import { NoiseFilter } from '../../src/audio/NoiseFilter';

describe('NoiseFilter', () => {
  let filter: NoiseFilter;

  beforeEach(() => {
    filter = new NoiseFilter();
  });

  describe('constructor', () => {
    it('should create a new NoiseFilter instance', () => {
      expect(filter).toBeInstanceOf(NoiseFilter);
    });
  });

  describe('process', () => {
    it('should process audio buffer and return same-length array', () => {
      const inputBuffer = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      const outputBuffer = filter.process(inputBuffer);
      
      expect(outputBuffer).toBeInstanceOf(Float32Array);
      expect(outputBuffer.length).toBe(inputBuffer.length);
    });

    it('should handle empty buffer', () => {
      const inputBuffer = new Float32Array(0);
      const outputBuffer = filter.process(inputBuffer);
      
      expect(outputBuffer).toBeInstanceOf(Float32Array);
      expect(outputBuffer.length).toBe(0);
    });

    it('should handle large buffer', () => {
      const inputBuffer = new Float32Array(4096);
      inputBuffer.fill(0.5);
      
      const outputBuffer = filter.process(inputBuffer);
      
      expect(outputBuffer).toBeInstanceOf(Float32Array);
      expect(outputBuffer.length).toBe(4096);
    });

    it('should return a new array (immutability)', () => {
      const inputBuffer = new Float32Array([0.1, 0.2, 0.3]);
      const outputBuffer = filter.process(inputBuffer);
      
      // Should be a different array instance
      expect(outputBuffer).not.toBe(inputBuffer);
    });
  });
});
