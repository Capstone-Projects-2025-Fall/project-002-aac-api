# Multi-API Speech Recognition with Confidence Scores

## Overview

The API now supports multiple speech recognition providers with confidence scoring. **By default, it uses all available APIs (Whisper, Google, Sphinx) and automatically selects the best result** based on confidence scores. This helps improve accuracy, especially for synthesized voices from AAC boards.

## Default Behavior

**The system automatically tries all available APIs and picks the best result:**
- **Whisper** - Best for robotic/synthesized voices (offline, high accuracy)
- **Google** - Good for natural speech (online, free tier)
- **Sphinx** - Offline fallback (works with synthesized voices)

The API with the highest confidence score is selected automatically.

## New Features

### 1. **Confidence Scores**
- Each API response includes a `confidenceScore` (0.0 to 1.0)
- Higher scores indicate more reliable transcriptions
- An `aggregatedConfidenceScore` averages all successful API results

### 2. **Multiple API Support**
- Try multiple APIs simultaneously
- Automatically selects the result with the highest confidence
- Falls back if one API fails

### 3. **Enhanced Logging**
- Confidence scores are logged to console
- Detailed metrics saved to log files (with consent)
- Track which API performs best for your use case

## Configuration

### Environment Variable

Set which APIs to use via the `SPEECH_APIS` environment variable:

```bash
# Default: Use all APIs (whisper,google,sphinx) and pick the best result
# No environment variable needed - automatically uses all available APIs

# Or specify which APIs to use:
export SPEECH_APIS=whisper,google,sphinx  # All three (recommended)
export SPEECH_APIS=whisper,google         # Whisper + Google fallback
export SPEECH_APIS=whisper               # Only Whisper (best for robotic voices)
export SPEECH_APIS=google                # Only Google (original default)
```

### Available APIs

1. **`google`** - Google Speech Recognition (free tier)
   - Works best with natural speech
   - Limited accuracy with synthesized voices
   - Requires internet connection
   - Default confidence: 0.7

2. **`whisper`** - OpenAI Whisper (RECOMMENDED for robotic/synthesized voices) ⭐
   - Excellent accuracy with synthesized/robotic voices
   - Works offline (no internet needed)
   - High accuracy overall
   - Provides confidence scores
   - Default confidence: 0.85
   - Install: `pip3 install openai-whisper` (requires Python 3.11+ with dev headers)
   - First run downloads model (~150MB)

3. **`sphinx`** - CMU Sphinx (offline)
   - Works offline (no internet needed)
   - Better with synthesized/robotic voices than Google
   - Less accurate overall than Whisper
   - Default confidence: 0.6
   - Install: `pip3 install pocketsphinx` (requires compilation)

4. **`google_cloud`** - Google Cloud Speech-to-Text (paid)
   - Requires API key and credentials
   - Better accuracy than free tier
   - Provides actual confidence scores
   - Requires: `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## API Response Format

The API now returns confidence scores in the response:

```json
{
  "success": true,
  "transcription": "Hello, how are you?",
  "confidenceScore": 0.7,
  "aggregatedConfidenceScore": 0.65,
  "selectedApi": "google",
  "apiResults": [
    {
      "apiProvider": "google",
      "transcription": "Hello, how are you?",
      "confidenceScore": 0.7,
      "processingTimeMs": 1234,
      "error": null
    },
    {
      "apiProvider": "sphinx",
      "transcription": "Hello how are you",
      "confidenceScore": 0.6,
      "processingTimeMs": 2345,
      "error": null
    }
  ],
  "audio": {
    "filename": "recording.wav",
    "size": 12345,
    "format": "WAV",
    "duration": 2.5,
    "sampleRate": 16000
  }
}
```

## Logging

### Console Logging

Confidence scores are automatically logged to the console:

```
[Confidence Score] Request: 2024-01-15T10:30:00.123Z, Score: 0.7, API: google, Transcription: Hello, how are you?...
```

### File Logging

With user consent, detailed metrics are saved to `logs/requests-YYYY-MM-DD.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "confidenceScore": 0.7,
  "aggregatedConfidenceScore": 0.65,
  "selectedApi": "google",
  "confidenceMetrics": {
    "confidenceScore": 0.7,
    "aggregatedConfidenceScore": 0.65,
    "selectedApi": "google",
    "apiCount": 2,
    "successfulApiCount": 2
  }
}
```

## Testing with Synthesized Voices

To test with AAC board synthesized voices:

1. **Install Whisper** (RECOMMENDED - best for synthesized voices):
   ```bash
   # Using Homebrew Python (recommended on macOS)
   /opt/homebrew/bin/pip3.11 install openai-whisper
   
   # Or using system Python (if you have dev headers)
   pip3 install openai-whisper
   ```

2. **Set environment variable**:
   ```bash
   # Use Whisper (best for robotic voices)
   export SPEECH_APIS=whisper
   
   # Or try multiple APIs and let it pick the best
   export SPEECH_APIS=whisper,google
   ```

3. **Start the API**:
   ```bash
   cd Initial_API
   node .
   ```

4. **Upload an audio file** from your AAC board and check:
   - Which API provides the best transcription
   - Confidence scores for each API
   - Logs to see performance over time

## Next Steps: Adding More APIs

To add better APIs for synthesized voices (like OpenAI Whisper, Azure, etc.), you'll need to:

1. Install additional Python libraries
2. Add API keys/credentials
3. Update `speech2.py` to call those APIs
4. Extract actual confidence scores from their responses

### Recommended APIs for Synthesized Voices

1. **OpenAI Whisper** - Excellent with synthesized voices ✅ NOW SUPPORTED
   - Install: `pip3 install openai-whisper`
   - Requires: Python 3.11+ with development headers (install via Homebrew on macOS)
   - Provides: High accuracy, confidence scores, works offline
   - Usage: Set `SPEECH_APIS=whisper` in environment variable

2. **Azure Speech Services** - Good with various voice types
   - Install: `pip3 install azure-cognitiveservices-speech`
   - Requires: Azure subscription and API key
   - Provides: Confidence scores, custom models

3. **Google Cloud Speech-to-Text** - Better than free tier
   - Already supported in code
   - Requires: `GOOGLE_APPLICATION_CREDENTIALS`
   - Provides: Actual confidence scores

## Troubleshooting

### Low Confidence Scores

If you're getting low confidence scores (< 0.5):
- Try using `whisper` API (best for synthesized/robotic voices) - **RECOMMENDED**
- Try using `sphinx` API (better for synthesized voices than Google)
- Check audio quality (sample rate, clarity)
- Consider using paid APIs (Azure, Google Cloud)

### API Not Working

- Check internet connection (for Google API)
- Verify Python dependencies are installed
- Check environment variables are set correctly
- Review error messages in `apiResults` array

## Example Usage

```bash
# Start API with Whisper (best for robotic voices)
cd Initial_API
export SPEECH_APIS=whisper
node .

# Or try multiple APIs
export SPEECH_APIS=whisper,google
node .

# In another terminal, test with curl
curl -X POST http://localhost:8080/upload \
  -F "audioFile=@test-audio.wav" \
  -H "x-logging-consent: true"
```

The response will include confidence scores and results from all APIs tried.

