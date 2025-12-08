/**
 * @fileoverview Unit tests for CacheManager.
 */

import { CacheManager } from '../../src/middleware/CacheManager';
import { IntentEvent } from '../../src/types';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  describe('constructor', () => {
    it('should create a new CacheManager instance', () => {
      expect(cache).toBeInstanceOf(CacheManager);
    });

    it('should accept maxSize and ttl', () => {
      const customCache = new CacheManager(50, 30000);
      expect(customCache).toBeInstanceOf(CacheManager);
    });
  });

  describe('get and set', () => {
    it('should cache and retrieve events', () => {
      const event: IntentEvent = {
        type: 'intent',
        timestamp: Date.now(),
        intent: {
          action: 'move',
          confidence: 0.9,
          transcript: 'move forward'
        }
      };

      cache.set(event);
      const cached = cache.get(event);
      expect(cached).not.toBeNull();
    });

    it('should return null for uncached events', () => {
      const event: IntentEvent = {
        type: 'intent',
        timestamp: Date.now(),
        intent: {
          action: 'jump',
          confidence: 0.8,
          transcript: 'jump'
        }
      };

      expect(cache.get(event)).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      // TODO: Add events and test clearing
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = cache.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('ttl');
    });
  });
});

