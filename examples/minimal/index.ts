/**
 * @fileoverview Minimal example integration of AAC SDK with a game loop.
 * 
 * This example demonstrates the basic usage of the AAC SDK in a game context.
 * It shows how to:
 * - Initialize the AACClient with configuration
 * - Subscribe to transcript, intent, and error events
 * - Start and stop the client
 * - Handle events in a game context
 */

import { AACClient } from '../../src/core/AACClient';
import { Intent, ErrorObject } from '../../src/types';

/**
 * Minimal game class that integrates with AAC SDK.
 */
class MinimalGame {
  private client: AACClient;

  constructor() {
    // Initialize AAC client with configuration
    this.client = new AACClient({
      asrAdapter: 'browser',
      confidenceThreshold: 0.7,
      inputType: 'free'
    });

    // Subscribe to transcript events
    this.client.subscribe('onTranscript', (transcript: string) => {
      console.log('[Transcript]', transcript);
    });

    // Subscribe to intent events
    this.client.subscribe('onIntent', (intent: Intent) => {
      console.log('[Intent]', {
        action: intent.action,
        params: intent.params,
        confidence: intent.confidence,
        transcript: intent.transcript
      });
      
      // Handle game actions based on intent
      this.handleGameAction(intent);
    });

    // Subscribe to error events
    this.client.subscribe('onError', (error: ErrorObject) => {
      console.error('[Error]', {
        code: error.code,
        message: error.message
      });
    });
  }

  /**
   * Starts the game and AAC client.
   */
  async start(): Promise<void> {
    try {
      console.log('Starting game...');
      await this.client.start();
      console.log('Game started! Voice commands are now active.');
      console.log('Try saying commands like: "move forward", "jump", "attack", etc.');
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Stops the game and releases resources.
   */
  stop(): void {
    console.log('Stopping game...');
    this.client.stop();
    console.log('Game stopped.');
  }

  /**
   * Handles game actions based on recognized intents.
   * 
   * @param intent - The parsed intent from voice input
   */
  private handleGameAction(intent: Intent): void {
    switch (intent.action) {
      case 'move':
        console.log(`Game action: Moving with params:`, intent.params);
        break;
      
      case 'jump':
        console.log('Game action: Jumping');
        break;
      
      case 'attack':
        console.log('Game action: Attacking');
        break;
      
      case 'stop':
        console.log('Game action: Stopping');
        break;
      
      case 'interact':
        console.log('Game action: Interacting');
        break;
      
      default:
        console.log(`Unknown game action: ${intent.action}`);
    }
  }

  /**
   * Gets the current running state of the client.
   * 
   * @returns True if the client is currently running
   */
  isRunning(): boolean {
    return this.client.getIsRunning();
  }
}

// Example usage
async function main() {
  const game = new MinimalGame();

  try {
    await game.start();

    // Example: Run for 30 seconds, then stop
    // In a real game, this would be your game loop
    setTimeout(() => {
      game.stop();
      console.log('Game session ended.');
      process.exit(0);
    }, 30000);
  } catch (error) {
    console.error('Game error:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MinimalGame };
