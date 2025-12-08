/**
 * @fileoverview Unit tests for IntentInterpreter.
 */

import { IntentInterpreter } from '../../src/pipeline/IntentInterpreter';

describe('IntentInterpreter', () => {
  let interpreter: IntentInterpreter;

  beforeEach(() => {
    interpreter = new IntentInterpreter();
  });

  describe('constructor', () => {
    it('should create a new IntentInterpreter instance', () => {
      expect(interpreter).toBeInstanceOf(IntentInterpreter);
    });

    it('should accept custom patterns', () => {
      const customInterpreter = new IntentInterpreter({
        patterns: [
          { action: 'custom', pattern: ['test'] }
        ]
      });
      expect(customInterpreter.getPatterns().length).toBe(1);
    });
  });

  describe('interpret', () => {
    it('should interpret transcript as intent', () => {
      const intent = interpreter.interpret('move forward');
      expect(intent).not.toBeNull();
      expect(intent?.action).toBe('move');
    });

    it('should return null for unrecognized transcript', () => {
      const intent = interpreter.interpret('unrecognized command');
      expect(intent).toBeNull();
    });

    it('should include confidence score', () => {
      const intent = interpreter.interpret('jump', 0.9);
      expect(intent?.confidence).toBeLessThanOrEqual(0.9);
    });
  });

  describe('addPattern', () => {
    it('should add custom pattern', () => {
      interpreter.addPattern({ action: 'test', pattern: ['test'] });
      const patterns = interpreter.getPatterns();
      expect(patterns.some(p => p.action === 'test')).toBe(true);
    });
  });

  describe('removePattern', () => {
    it('should remove pattern by action', () => {
      interpreter.removePattern('move');
      const patterns = interpreter.getPatterns();
      expect(patterns.some(p => p.action === 'move')).toBe(false);
    });
  });
});

