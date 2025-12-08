/**
 * @fileoverview Optional fast-mapping cache for repeated inputs to reduce latency.
 * @module middleware/CacheManager
 */

import { AudioEvent, IntentEvent } from '../types';

/**
 * Cache entry structure.
 * 
 * @public
 */
interface CacheEntry {
  event: AudioEvent;
  timestamp: number;
  hitCount: number;
}

/**
 * Cache manager for fast-mapping repeated inputs.
 * 
 * Reduces latency by caching previously recognized intents and transcripts.
 * Useful for common commands that are repeated frequently.
 * 
 * @example
 * ```typescript
 * const cache = new CacheManager({ ttl: 60000, maxSize: 100 });
 * const cached = cache.get(event);
 * if (!cached) {
 *   cache.set(event);
 * }
 * ```
 * 
 * @public
 */
export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  /**
   * Creates a new CacheManager instance.
   * 
   * @param maxSize - Maximum number of cache entries
   * @param ttl - Time to live for cache entries in milliseconds
   */
  constructor(maxSize: number = 100, ttl: number = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Gets a cached event by key.
   * 
   * @param event - Event to look up in cache
   * @returns Cached event if found and not expired, null otherwise
   */
  get(event: AudioEvent): AudioEvent | null {
    const key = this.generateKey(event);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    return entry.event;
  }

  /**
   * Stores an event in the cache.
   * 
   * @param event - Event to cache
   */
  set(event: AudioEvent): void {
    const key = this.generateKey(event);

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      event,
      timestamp: Date.now(),
      hitCount: 0
    });
  }

  /**
   * Generates a cache key from an event.
   * 
   * @private
   */
  private generateKey(event: AudioEvent): string {
    if (event.type === 'intent' && 'intent' in event) {
      const intentEvent = event as IntentEvent;
      return `intent:${intentEvent.intent.action}:${JSON.stringify(intentEvent.intent.params || {})}`;
    }
    
    if (event.type === 'transcript' && 'transcript' in event) {
      return `transcript:${event.transcript.toLowerCase().trim()}`;
    }

    return `event:${event.type}:${Date.now()}`;
  }

  /**
   * Evicts the oldest cache entry.
   * 
   * @private
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics.
   * 
   * @returns Object with cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  /**
   * Sets the cache TTL.
   * 
   * @param ttl - New TTL in milliseconds
   */
  setTTL(ttl: number): void {
    this.ttl = ttl;
  }

  /**
   * Sets the maximum cache size.
   * 
   * @param maxSize - New maximum size
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    
    // Evict entries if necessary
    while (this.cache.size > maxSize) {
      this.evictOldest();
    }
  }
}

