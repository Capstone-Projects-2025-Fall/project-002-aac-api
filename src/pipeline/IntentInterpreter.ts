/**
 * @fileoverview Converts transcripts into structured intents for game actions.
 * @module pipeline/IntentInterpreter
 */

import { Intent } from '../types';

/**
 * Configuration for intent interpretation.
 * 
 * @public
 */
export interface IntentInterpreterConfig {
  /** Minimum confidence threshold for intent recognition */
  minConfidence?: number;
  /** Custom intent patterns for matching */
  patterns?: IntentPattern[];
}

/**
 * Pattern definition for intent matching.
 * 
 * @public
 */
export interface IntentPattern {
  /** Action name to assign when pattern matches */
  action: string;
  /** Regular expression or keyword array to match against transcript */
  pattern: RegExp | string[];
  /** Optional parameter extraction rules */
  params?: Record<string, string>;
}

/**
 * Interprets transcripts and converts them into structured intents.
 * 
 * Parses natural language transcripts and maps them to game actions
 * with parameters. Supports pattern matching and keyword recognition.
 * 
 * @example
 * ```typescript
 * const interpreter = new IntentInterpreter({
 *   patterns: [
 *     { action: 'move', pattern: ['move', 'go', 'walk'] },
 *     { action: 'jump', pattern: ['jump', 'leap'] }
 *   ]
 * });
 * 
 * const intent = interpreter.interpret('move forward');
 * // Returns: { action: 'move', params: { direction: 'forward' }, ... }
 * ```
 * 
 * @public
 */
export class IntentInterpreter {
  private patterns: IntentPattern[];
  private minConfidence: number;

  /**
   * Creates a new IntentInterpreter instance.
   * 
   * @param config - Configuration options
   */
  constructor(config: IntentInterpreterConfig = {}) {
    this.patterns = config.patterns || this.getDefaultPatterns();
    this.minConfidence = config.minConfidence || 0.5;
  }

  /**
   * Interprets a transcript and returns a structured intent.
   * 
   * @param transcript - The transcript text to interpret
   * @param confidence - Confidence score from ASR (0-1)
   * @returns Parsed intent, or null if no match found
   */
  interpret(transcript: string, confidence: number = 0.8): Intent | null {
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Try to match against patterns
    for (const pattern of this.patterns) {
      const match = this.matchPattern(normalizedTranscript, pattern);
      if (match) {
        return {
          action: pattern.action,
          params: this.extractParams(normalizedTranscript, pattern),
          confidence: Math.min(confidence, match.confidence),
          transcript
        };
      }
    }

    // No match found
    return null;
  }

  /**
   * Matches a transcript against a pattern.
   * 
   * @private
   */
  private matchPattern(transcript: string, pattern: IntentPattern): { confidence: number } | null {
    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(transcript) ? { confidence: 0.9 } : null;
    }

    if (Array.isArray(pattern.pattern)) {
      const keywords = pattern.pattern.map(k => k.toLowerCase());
      const words = transcript.split(/\s+/);
      const matches = words.filter(word => keywords.includes(word));
      
      if (matches.length > 0) {
        return { confidence: matches.length / keywords.length };
      }
    }

    return null;
  }

  /**
   * Extracts parameters from a transcript based on pattern rules.
   * 
   * @private
   */
  private extractParams(transcript: string, pattern: IntentPattern): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (pattern.params) {
      // Placeholder for parameter extraction logic
      // TODO: Implement actual parameter extraction based on pattern.params rules
    }

    return params;
  }

  /**
   * Gets default intent patterns for common game actions.
   * 
   * @private
   */
  private getDefaultPatterns(): IntentPattern[] {
    return [
      { action: 'move', pattern: ['move', 'go', 'walk', 'run'] },
      { action: 'jump', pattern: ['jump', 'leap'] },
      { action: 'attack', pattern: ['attack', 'hit', 'strike'] },
      { action: 'stop', pattern: ['stop', 'halt', 'pause'] },
      { action: 'interact', pattern: ['interact', 'use', 'activate'] }
    ];
  }

  /**
   * Adds a custom intent pattern.
   * 
   * @param pattern - Pattern to add
   */
  addPattern(pattern: IntentPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Removes an intent pattern by action name.
   * 
   * @param action - Action name of pattern to remove
   */
  removePattern(action: string): void {
    this.patterns = this.patterns.filter(p => p.action !== action);
  }

  /**
   * Gets all registered patterns.
   * 
   * @returns Array of all intent patterns
   */
  getPatterns(): IntentPattern[] {
    return [...this.patterns];
  }
}

