# AAC SDK Specification

## Goal
- Create a lightweight, dependency-minimal **TypeScript SDK** for audio-based games.
- Developers should be able to integrate audio input, voice recognition, and intent handling **without bundling extra files**.
- Event-driven API: handles transcripts, parsed intents, and callbacks to game logic.
- Extensible architecture for future features like caching, telemetry, and fast-mapping of repeated inputs.

---

## Folder Structure

/src ← SDK source code
/audio ← Audio input, noise filtering, utilities
/asr ← ASR adapters (browser / remote)
/pipeline ← Processing audio → intent
/core ← AACClient entrypoint, event management
/types ← Shared TypeScript types and interfaces
/middleware ← Optional modules for logging, caching, latency
/tests ← Unit, integration, acceptance test stubs
/examples ← Minimal example integrations with placeholder games
/documentation ← Docusaurus docs (already exists, untouched)
/scripts ← Build, lint, utility scripts
package.json ← Root-level SDK + dev config
tsconfig.json ← Root-level TypeScript config
README.md

---

## Modules / Placeholder Files

### /src/core
- `AACClient.ts` → Entrypoint class, manages event subscriptions, starts audio pipeline
- `index.ts` → Re-exports core SDK API

### /src/audio
- `MicManager.ts` → Handles microphone access and permissions
- `NoiseFilter.ts` → Optional noise reduction / filtering utilities
- `AudioUtils.ts` → Helper functions for buffer manipulation, normalization, etc.

### /src/asr
- `BrowserASRAdapter.ts` → Uses browser speech recognition
- `RemoteASRAdapter.ts` → Placeholder for remote server-based ASR integration

### /src/pipeline
- `IntentInterpreter.ts` → Converts transcripts into structured intents
- `PipelineManager.ts` → Coordinates audio → ASR → intent flow

### /src/middleware
- `Logger.ts` → Logging / telemetry hooks
- `CacheManager.ts` → Optional fast-mapping cache for repeated inputs
- `LatencyTracker.ts` → Measure time from audio input to callback

### /src/types
- `index.ts` → All shared TypeScript interfaces and types (e.g., `Intent`, `AudioEvent`)

---

## Testing

- **Unit tests** → Each module in `/src` has a corresponding test in `/tests/unit`
- **Integration tests** → Test pipeline end-to-end: audio → ASR → intents
- **Acceptance tests** → Simulate a dev using SDK in `/examples`
- Use **mock audio files** for deterministic tests

Example structure:

/tests
/unit
AACClient.test.ts
MicManager.test.ts
NoiseFilter.test.ts
/integration
Pipeline.test.ts
/acceptance
ExampleGame.test.ts

---

## Examples

- `/examples/minimal` → Minimal game loop integration with AACClient  
- `/examples/refactor-demo` → Placeholder for later demo integrating old game repos

---

## Documentation Notes

- Use **TSDoc comments** in all modules  
- Docusaurus pages:
  - `docs/getting-started.md`
  - `docs/api-reference/<module>.md` generated from TSDoc
  - `docs/architecture.md`
  - `docs/testing-guide.md`
  - `docs/examples.md` linking `/examples`
- Professional formatting: code blocks, tables, headers, inline notes for developers
- Keep `/documentation` folder untouched

---

## Optional / Future Features

- **Fast-mapping cache**: map repeated inputs to reduce latency
- **Telemetry hooks**: optional analytics on input timing / recognition
- **Plugin system**: allow developers to extend pipeline with custom modules
- **Multiple ASR adapters**: support browser, remote, or offline options

