# Installation Guide

## For Users Installing This Library

### Option 1: Install from npm (if published)

```bash
npm install aac-speech-recognition
```

### Option 2: Install from GitHub

```bash
npm install git+https://github.com/your-org/project-002-aac-api.git#main:Initial_API
```

### Option 3: Install Locally

```bash
# Clone the repository
git clone https://github.com/your-org/project-002-aac-api.git
cd project-002-aac-api/Initial_API

# Install Node.js dependencies
npm install
```

## Python Requirements

This library requires Python 3.11+ with the following packages installed:

### macOS (Recommended: Use Homebrew Python)

```bash
# Install Python 3.11 via Homebrew
brew install python@3.11

# Install Python dependencies
/opt/homebrew/bin/pip3.11 install openai-whisper SpeechRecognition pocketsphinx
```

### Linux

```bash
# Install Python 3.11
sudo apt-get install python3.11 python3.11-pip  # Ubuntu/Debian
# or
sudo yum install python3.11 python3.11-pip     # CentOS/RHEL

# Install Python dependencies
pip3.11 install openai-whisper SpeechRecognition pocketsphinx
```

### Windows

```bash
# Install Python 3.11 from python.org
# Then install dependencies
pip install openai-whisper SpeechRecognition pocketsphinx
```

## Verify Installation

```bash
# Check Python version
python3.11 --version

# Verify Python packages
python3.11 -c "import whisper; import speech_recognition; import pocketsphinx; print('All packages installed!')"
```

## Environment Variables (Optional)

Set which APIs to use:

```bash
export SPEECH_APIS=whisper,google,sphinx  # All three (default)
export SPEECH_APIS=whisper,google         # Whisper + Google
export SPEECH_APIS=whisper               # Only Whisper
```

## Troubleshooting

### Python Not Found

If you get "Python not found" errors:

1. Make sure Python 3.11+ is installed
2. Verify it's in your PATH: `which python3.11` or `where python3.11`
3. Or specify the path in your code:
   ```javascript
   const result = await transcribeAudio(audioBuffer, {
       pythonPath: '/opt/homebrew/bin/python3.11'
   });
   ```

### Whisper Model Download

On first use, Whisper will download a model (~150MB). This happens automatically but requires internet connection.

### Missing Python Packages

If you get import errors, make sure all Python packages are installed:
```bash
pip3.11 install openai-whisper SpeechRecognition pocketsphinx
```

