/**
 * @fileoverview Shared TypeScript types and interfaces for the AAC SDK.
 * @module types
 */

/**
 * Configuration options for AACClient.
 * 
 * @public
 */
export interface AACClientConfig {
  /** ASR adapter type to use */
  asrAdapter?: 'browser' | 'remote';
  /** Confidence threshold (0-1) for intent recognition */
  confidenceThreshold?: number;
  /** Input type for processing */
  inputType?: 'free' | 'multipleChoice' | 'numeric';
  /** Enable caching for repeated inputs */
  enableCache?: boolean;
  /** Enable noise filtering */
  enableNoiseFilter?: boolean;
  /** Enable logging/telemetry */
  enableLogging?: boolean;
}

/**
 * Event types emitted by the AAC SDK.
 * 
 * @public
 */
export type AACEvent = 'onTranscript' | 'onIntent' | 'onError';

/**
 * Represents a structured intent parsed from a transcript.
 * 
 * @public
 */
export interface Intent {
  /** The action or command name (e.g., "move", "jump", "attack") */
  action: string;
  /** Optional parameters for the action (e.g., direction, target) */
  params?: Record<string, unknown>;
  /** Confidence score (0-1) for the intent recognition */
  confidence: number;
  /** Original transcript text that generated this intent */
  transcript: string;
}

/**
 * Base interface for audio events.
 * 
 * @public
 */
export interface AudioEvent {
  /** Type of audio event */
  type: string;
  /** Timestamp when the event occurred */
  timestamp: number;
  /** Optional event-specific data */
  data?: unknown;
}

/**
 * Error object with code and message.
 * 
 * @public
 */
export interface ErrorObject {
  /** Error code identifier */
  code: string;
  /** Human-readable error message */
  message: string;
}
  
  export interface TranscriptEvent extends AudioEvent {
    transcript: string;
    confidence: number;
  }
  
  export interface IntentEvent extends AudioEvent {
    intent: Intent; // reuse your existing Intent interface
    confidence?: number;
  }
  
