/**
 * @fileoverview Unit tests for BrowserASRAdapter.
 */

import { BrowserASRAdapter } from '../../src/asr/BrowserASRAdapter';

describe('BrowserASRAdapter', () => {
  let adapter: BrowserASRAdapter;

  beforeEach(() => {
    adapter = new BrowserASRAdapter();
  });

  afterEach(() => {
    if (adapter.isRunning()) {
      adapter.stop();
    }
  });

  describe('constructor', () => {
    it('should create a new BrowserASRAdapter instance', () => {
      expect(adapter).toBeInstanceOf(BrowserASRAdapter);
    });
  });

  describe('start', () => {
    it('should start speech recognition', () => {
      // TODO: Mock SpeechRecognition API and test
    });

    it('should throw error if SpeechRecognition is not available', () => {
      // TODO: Test in environment without SpeechRecognition
    });

    it('should call onTranscript callback with results', () => {
      // TODO: Implement test
    });

    it('should call onError callback on errors', () => {
      // TODO: Implement test
    });
  });

  describe('stop', () => {
    it('should stop speech recognition', () => {
      // TODO: Implement test
    });
  });

  describe('setLanguage', () => {
    it('should set recognition language', () => {
      adapter.setLanguage('es-ES');
      expect(adapter.getLanguage()).toBe('es-ES');
    });
  });
});

