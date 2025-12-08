/**
 * @fileoverview Shared TypeScript types and interfaces for the AAC SDK.
 * @module types
 */

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
 * Audio event types emitted by the SDK.
 * 
 * @public
 */
export type AudioEventType = 
  | 'audio-start'
  | 'audio-end'
  | 'transcript'
  | 'intent'
  | 'error';

/**
 * Base interface for all audio events.
 * 
 * @public
 */
export interface AudioEvent {
  /** Type of audio event */
  type: AudioEventType;
  /** Timestamp when the event occurred */
  timestamp: number;
  /** Optional event-specific data */
  data?: unknown;
}

/**
 * Transcript event data.
 * 
 * @public
 */
export interface TranscriptEvent extends AudioEvent {
  type: 'transcript';
  /** The recognized transcript text */
  transcript: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Intent event data.
 * 
 * @public
 */
export interface IntentEvent extends AudioEvent {
  type: 'intent';
  /** The parsed intent */
  intent: Intent;
}

/**
 * Error event data.
 * 
 * @public
 */
export interface ErrorEvent extends AudioEvent {
  type: 'error';
  /** Error message */
  message: string;
  /** Optional error code */
  code?: string;
}

/**
 * Configuration options for AACClient.
 * 
 * @public
 */
export interface AACClientConfig {
  /** Enable noise filtering */
  enableNoiseFilter?: boolean;
  /** Enable caching for repeated inputs */
  enableCache?: boolean;
  /** Enable logging/telemetry */
  enableLogging?: boolean;
  /** ASR adapter type to use */
  asrAdapter?: 'browser' | 'remote';
  /** Custom ASR endpoint URL (for remote adapter) */
  asrEndpoint?: string;
}

/**
 * Callback function type for audio events.
 * 
 * @public
 */
export type AudioEventCallback = (event: AudioEvent) => void;

/**
 * Callback function type for intent events.
 * 
 * @public
 */
export type IntentCallback = (intent: Intent) => void;

