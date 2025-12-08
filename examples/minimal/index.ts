/**
 * @fileoverview Minimal example integration of AAC SDK with a game loop.
 * 
 * This example demonstrates the basic usage of the AAC SDK in a game context.
 * It shows how to:
 * - Initialize the AACClient
 * - Subscribe to intent events
 * - Handle game actions based on voice commands
 * - Clean up resources
 */

import { AACClient, Intent } from '../../src/core';

/**
 * Simple game state for demonstration.
 */
interface GameState {
  position: { x: number; y: number };
  health: number;
  score: number;
}

/**
 * Minimal game class that integrates with AAC SDK.
 */
class MinimalGame {
  private client: AACClient;
  private gameState: GameState;

  constructor() {
    // Initialize AAC client with default configuration
    this.client = new AACClient({
      enableNoiseFilter: true,
      enableCache: true,
      enableLogging: false, // Set to true for debugging
      asrAdapter: 'browser'
    });

    // Initialize game state
    this.gameState = {
      position: { x: 0, y: 0 },
      health: 100,
      score: 0
    };

    // Subscribe to intent events
    this.client.onIntent((intent: Intent) => {
      this.handleIntent(intent);
    });

    // Subscribe to all events for logging (optional)
    this.client.onEvent((event) => {
      if (event.type === 'error') {
        console.error('AAC SDK Error:', event.data);
      }
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
      console.log('Try saying: "move forward", "jump", "attack", etc.');
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
   * Handles intent events from the AAC SDK.
   * 
   * @param intent - The parsed intent from voice input
   */
  private handleIntent(intent: Intent): void {
    console.log(`Received intent: ${intent.action}`, intent.params);

    switch (intent.action) {
      case 'move':
        this.handleMove(intent.params);
        break;
      
      case 'jump':
        this.handleJump();
        break;
      
      case 'attack':
        this.handleAttack();
        break;
      
      case 'stop':
        this.handleStop();
        break;
      
      case 'interact':
        this.handleInteract();
        break;
      
      default:
        console.log(`Unknown action: ${intent.action}`);
    }
  }

  /**
   * Handles move action.
   * 
   * @param params - Optional parameters (e.g., direction)
   */
  private handleMove(params?: Record<string, unknown>): void {
    const direction = params?.direction as string || 'forward';
    console.log(`Moving ${direction}...`);
    
    // Update game state based on direction
    switch (direction.toLowerCase()) {
      case 'forward':
      case 'up':
        this.gameState.position.y += 1;
        break;
      case 'backward':
      case 'down':
        this.gameState.position.y -= 1;
        break;
      case 'left':
        this.gameState.position.x -= 1;
        break;
      case 'right':
        this.gameState.position.x += 1;
        break;
    }
    
    console.log(`New position: (${this.gameState.position.x}, ${this.gameState.position.y})`);
  }

  /**
   * Handles jump action.
   */
  private handleJump(): void {
    console.log('Jumping!');
    // Game logic for jump would go here
  }

  /**
   * Handles attack action.
   */
  private handleAttack(): void {
    console.log('Attacking!');
    this.gameState.score += 10;
    console.log(`Score: ${this.gameState.score}`);
  }

  /**
   * Handles stop action.
   */
  private handleStop(): void {
    console.log('Stopping...');
    // Game logic for stop would go here
  }

  /**
   * Handles interact action.
   */
  private handleInteract(): void {
    console.log('Interacting with object...');
    // Game logic for interaction would go here
  }

  /**
   * Gets the current game state.
   * 
   * @returns Current game state
   */
  getGameState(): GameState {
    return { ...this.gameState };
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

