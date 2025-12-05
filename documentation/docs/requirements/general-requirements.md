---
sidebar_position: 3
---

# General Requirements

This page describes the main tools, platforms, and resources our team is using to develop and test the project. The goal is to make sure everyone can work in a consistent environment and understand what’s needed to build and maintain the system effectively.

---

## 1. Development Environment

### Required Tools
- **Git & GitHub** – used for version control, collaboration, and hosting our documentation through Docusaurus.  
- **Node.js** (v18 or later) – runs both the Express backend and the Docusaurus site.  
- **Python 3.x** – supports backend functionality and potential AAC-related features down the line.  
- **Visual Studio Code (VS Code)** – our main editor for coding and documentation work.  
- **Discord** – used for quick communication and group coordination.  
- **Jira** – tracks tasks and helps us stay organized during sprints.

### Recommonded Extenstions (VS Code)
- **Python** - For Python development and debugging
- **REST Client** - for testing API endpoints directly in VS Code

## 2. Hardware Requirements

- A **laptop or desktop computer** that can run Node.js and Python smoothly.  
- **Microphone access**, needed for testing AAC and speech-based features.  
- **Speakers or headphones**, for listening to audio output.

---

## 3. Software Dependencies

Below are the main technologies we’re currently using or planning to integrate:

| Category | Dependency | Purpose |
|-----------|-------------|----------|
| Backend | **Express (Node.js)** | Handles API routing and server logic |
| Backend Support | **Python** | Used for AAC-related logic or potential data processing |
| Frontend | **Docusaurus** | Manages and hosts the project documentation |
| Python Speech Recognition | **SpeechRecognition** | Converts audio to text using Google Speech Recognition API |
| Reference Tool | **CoughDrop** | Used to reference and test AAC boards and speech interaction |


---

## 4. Network Requirements

- **Internet Access** – required for:
  - Using GitHUb for version control
  - Accessing Docusaurus documentation
  - Google Speech Recognition API calls (used by the Python backend)
  - Testing with AAC boards
- **Stable Connection** – essential for speech recognition APi calls and testing real-time AAC interactions 

---

## 5. Supported Audio Formats

The API currently supports the following audio formats for speech-to-text processing:
| Format | Extension | Notes | 
|--------|-----------|-------|
| WAV | .wav | Recommended format, best compatability |
| FLAC | .flac | Lossless compression, good quality |
| AIIF | .aiif | Apple audio format |
| MP3 | .mp3 | Compressed format |
| OGG | .ogg | Open-soruce format |
| M4A | .m4a | Apple compressed audio |

**Note**: WAV format is recommended for best results for its uncompressed nature and full compatiblity with the speech recognition library.

---

## 6. Documentation & Collaboration Tools

| Tool | Purpose |
|------|----------|
| **GitHub** | Stores the codebase and documentation, and tracks version history |
| **Docusaurus** | Generates and hosts our documentation site |
| **Jira** | Organizes work items and team progress |
| **Discord** | Main communication platform for daily collaboration |

---

## 7. Testing Requirements

## Unit Testing
- **Framework**: Jest
- **Test Files**: Located in 'Inital_API/__tests__/' directory
- **Run Tests**: 'npm test'
- **Coverage**: Aim for 80%+ code coverage on paths

---

## 8. Platform Compatibility

The API is designed to be cross-platform compatible:

| Platform | Python | Status |
|----------|--------|--------|
| **Windows** | 'python' | Fully Supported |
| **macOS** | 'python3' | Fully Supported |
| **Linux** | 'python3' | Fully Supported |

**Note**: The API automatically detects the platform and uses the appropriate Python command


## 9. Summary

These tools and requirements make up the foundation of our development process. The API is built with Express.js and Python, providing a robust audio-to-text processing pipeline that supports multiple audio formats and includes logging and metadata tracking. Keeping everyone on the same setup helps us avoid compatibility issues and stay consistent. 
