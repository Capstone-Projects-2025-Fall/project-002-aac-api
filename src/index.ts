/**
 * @fileoverview Main entry point for the AAC SDK.
 * @module index
 */

export * from './core';
export * from './types';
export * from './audio/MicManager';
export * from './audio/NoiseFilter';
export * from './audio/AudioUtils';
export * from './asr/BrowserASRAdapter';
export * from './asr/RemoteASRAdapter';
export * from './pipeline/IntentInterpreter';
export * from './pipeline/PipelineManager';
export * from './middleware/Logger';
export * from './middleware/CacheManager';
export * from './middleware/LatencyTracker';

