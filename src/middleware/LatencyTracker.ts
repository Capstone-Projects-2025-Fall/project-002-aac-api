/**
 * @fileoverview Measures time from audio input to callback execution.
 * @module middleware/LatencyTracker
 */

/**
 * Latency measurement data.
 * 
 * @public
 */
export interface LatencyMeasurement {
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Total latency in milliseconds */
  latency: number;
  /** Event type that was measured */
  eventType: string;
}

/**
 * Latency tracker for measuring processing time.
 * 
 * Tracks the time from audio input to callback execution, helping
 * developers identify performance bottlenecks in the pipeline.
 * 
 * @example
 * ```typescript
 * const tracker = new LatencyTracker();
 * tracker.start('intent-processing');
 * // ... processing ...
 * const measurement = tracker.end('intent-processing');
 * console.log(`Latency: ${measurement.latency}ms`);
 * ```
 * 
 * @public
 */
export class LatencyTracker {
  private measurements: LatencyMeasurement[] = [];
  private activeTimers: Map<string, number> = new Map();
  private maxMeasurements: number;

  /**
   * Creates a new LatencyTracker instance.
   * 
   * @param maxMeasurements - Maximum number of measurements to keep
   */
  constructor(maxMeasurements: number = 1000) {
    this.maxMeasurements = maxMeasurements;
  }

  /**
   * Starts timing for an event.
   * 
   * @param eventType - Type of event to track
   * @returns The start timestamp
   */
  start(eventType: string): number {
    const startTime = performance.now();
    this.activeTimers.set(eventType, startTime);
    return startTime;
  }

  /**
   * Ends timing for an event and records the measurement.
   * 
   * @param eventType - Type of event to end tracking
   * @returns The latency measurement, or null if no start time was found
   */
  end(eventType: string): LatencyMeasurement | null {
    const startTime = this.activeTimers.get(eventType);
    if (!startTime) {
      return null;
    }

    const endTime = performance.now();
    const latency = endTime - startTime;

    const measurement: LatencyMeasurement = {
      startTime,
      endTime,
      latency,
      eventType
    };

    this.measurements.push(measurement);
    this.activeTimers.delete(eventType);

    // Maintain max measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    return measurement;
  }

  /**
   * Gets all measurements for a specific event type.
   * 
   * @param eventType - Event type to filter by
   * @returns Array of measurements
   */
  getMeasurements(eventType?: string): LatencyMeasurement[] {
    if (eventType) {
      return this.measurements.filter(m => m.eventType === eventType);
    }
    return [...this.measurements];
  }

  /**
   * Gets average latency for an event type.
   * 
   * @param eventType - Event type to calculate average for
   * @returns Average latency in milliseconds, or null if no measurements
   */
  getAverageLatency(eventType?: string): number | null {
    const measurements = this.getMeasurements(eventType);
    if (measurements.length === 0) {
      return null;
    }

    const sum = measurements.reduce((acc, m) => acc + m.latency, 0);
    return sum / measurements.length;
  }

  /**
   * Gets minimum latency for an event type.
   * 
   * @param eventType - Event type to find minimum for
   * @returns Minimum latency in milliseconds, or null if no measurements
   */
  getMinLatency(eventType?: string): number | null {
    const measurements = this.getMeasurements(eventType);
    if (measurements.length === 0) {
      return null;
    }

    return Math.min(...measurements.map(m => m.latency));
  }

  /**
   * Gets maximum latency for an event type.
   * 
   * @param eventType - Event type to find maximum for
   * @returns Maximum latency in milliseconds, or null if no measurements
   */
  getMaxLatency(eventType?: string): number | null {
    const measurements = this.getMeasurements(eventType);
    if (measurements.length === 0) {
      return null;
    }

    return Math.max(...measurements.map(m => m.latency));
  }

  /**
   * Clears all measurements.
   */
  clear(): void {
    this.measurements = [];
    this.activeTimers.clear();
  }

  /**
   * Gets statistics for all measurements.
   * 
   * @returns Object with latency statistics
   */
  getStats(): {
    total: number;
    average: number | null;
    min: number | null;
    max: number | null;
  } {
    return {
      total: this.measurements.length,
      average: this.getAverageLatency(),
      min: this.getMinLatency(),
      max: this.getMaxLatency()
    };
  }
}

