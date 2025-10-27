# 🎤 AAC API - Voice-Controlled Tic-Tac-Toe Game

A comprehensive Augmentative and Alternative Communication (AAC) API with a voice-controlled Tic-Tac-Toe game that demonstrates speech-to-text and text-to-speech capabilities.

## 🚀 Live Demo

**🌐 Documentation & Game**: [http://localhost:3000/aac-api/tic-tac-toe](http://localhost:3000/aac-api/tic-tac-toe)  
**🔧 API Endpoints**: [http://localhost:8080](http://localhost:8080)

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Jira Stories Completed](#-jira-stories-completed)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎮 Voice-Controlled Tic-Tac-Toe Game
- **Voice Recognition**: Speak commands to place marks
- **Text-to-Speech**: Audio announcements for all actions
- **Real-time API Logging**: See live API input/output under the board
- **Win Detection**: Automatic game state management
- **Accessibility**: Designed for users with communication needs

### 🔧 API Capabilities
- **Speech-to-Text**: Convert audio to text using Google Speech Recognition
- **Text-to-Speech**: Generate audio from text
- **File Upload**: Handle audio file processing
- **Health Monitoring**: System status and metrics
- **CORS Support**: Cross-origin resource sharing enabled

### 📊 Monitoring & Testing
- **Unit Tests**: Comprehensive test coverage
- **API Testing**: Automated endpoint testing
- **Error Handling**: Robust error management
- **Live Logging**: Real-time API interaction display

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python 3** (v3.7+)
- **Yarn** or **npm**
- **Microphone** (for voice commands)

### 1. Clone the Repository
```bash
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git
cd project-002-aac-api
```

### 2. Install Dependencies

**API Dependencies:**
```bash
cd Initial_API
npm install
```

**Documentation Dependencies:**
```bash
cd ../documentation
yarn install
```

**Python Dependencies:**
```bash
pip3 install SpeechRecognition
```

### 3. Start the Servers

**Terminal 1 - Start Documentation Server:**
```bash
cd documentation
ORG_NAME=your-org PROJECT_NAME=aac-api yarn start --host 0.0.0.0
```

**Terminal 2 - Start API Server:**
```bash
cd Initial_API
node .
```

### 4. Access the Application

- **🎮 Tic-Tac-Toe Game**: [http://localhost:3000/aac-api/tic-tac-toe](http://localhost:3000/aac-api/tic-tac-toe)
- **📚 Documentation**: [http://localhost:3000/aac-api/](http://localhost:3000/aac-api/)
- **🔧 API Health**: [http://localhost:8080/test](http://localhost:8080/test)

## 📖 Usage

### Playing the Voice-Controlled Tic-Tac-Toe Game

1. **Open the Game**: Navigate to [http://localhost:3000/aac-api/tic-tac-toe](http://localhost:3000/aac-api/tic-tac-toe)

2. **Voice Commands**:
   - Click **"Record Command"** button
   - Speak clearly for 3 seconds (auto-stops)
   - Use these voice commands:
     - **Positions**: "center", "top left", "bottom right"
     - **Numbers**: "1", "2", "3", "4", "5", "6", "7", "8", "9"
     - **Game Control**: "new game", "reset"

3. **Watch the API Log**: See live API input/output under the game board

4. **Audio Feedback**: Listen to text-to-speech announcements for all actions

### API Endpoints

#### Health Check
```bash
GET http://localhost:8080/test
```
**Response:**
```json
{
  "name": "Test1",
  "status": "test"
}
```

#### Audio Upload (Speech-to-Text)
```bash
POST http://localhost:8080/upload
Content-Type: multipart/form-data
Body: audioFile (WAV audio data)
```
**Response:**
```json
{
  "message": "Audio processed successfully",
  "transcription": "center",
  "filename": "recording.wav",
  "size": "12345 bytes"
}
```

#### Parameterized Test
```bash
POST http://localhost:8080/test/:id
Content-Type: application/json
Body: {"info": "center"}
```
**Response:**
```json
{
  "name": "Test message with info: center and ID: center"
}
```

## 🧪 Testing

### Run Unit Tests
```bash
cd Initial_API
npm test
```

### Test Coverage
```bash
cd Initial_API
npm run test:coverage
```

### Manual Testing
1. **Voice Commands**: Test all position commands
2. **API Endpoints**: Verify all endpoints respond correctly
3. **Error Handling**: Test invalid commands and network errors
4. **Audio Processing**: Test with different audio files

## 📁 Project Structure

```
project-002-aac-api/
├── Initial_API/                 # Node.js API Server
│   ├── index.js                # Main API server
│   ├── speech2.py              # Python speech recognition
│   ├── __tests__/              # Unit tests
│   └── package.json            # API dependencies
├── documentation/               # Docusaurus Documentation
│   ├── src/
│   │   ├── components/
│   │   │   └── TicTacToe/      # Voice-controlled game
│   │   └── pages/
│   │       └── tic-tac-toe.js  # Game page
│   ├── docs/                   # Documentation content
│   └── package.json            # Documentation dependencies
└── README.md                   # This file
```

## 📋 Jira Stories Completed

### ✅ Epic: AAC API Development

#### **Story 1: Basic API Infrastructure**
- **ID**: AAC-001
- **Title**: Set up Express.js API server with basic endpoints
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] Express server running on port 8080
  - [x] Health check endpoint (`/test`)
  - [x] CORS middleware configured
  - [x] Error handling implemented

#### **Story 2: Speech-to-Text Integration**
- **ID**: AAC-002
- **Title**: Implement audio upload and speech recognition
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] File upload endpoint (`/upload`)
  - [x] Python speech recognition integration
  - [x] Google Speech Recognition API
  - [x] Audio format conversion (WAV)

#### **Story 3: Voice-Controlled Tic-Tac-Toe Game**
- **ID**: AAC-003
- **Title**: Create React-based Tic-Tac-Toe with voice controls
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] React component with game logic
  - [x] Voice command recognition
  - [x] Position mapping (center, top left, etc.)
  - [x] Player alternation (X ↔ O)
  - [x] Win/draw detection

#### **Story 4: Text-to-Speech Integration**
- **ID**: AAC-004
- **Title**: Add audio announcements for game actions
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] Speech synthesis for move announcements
  - [x] Win/draw notifications
  - [x] Turn announcements
  - [x] Error message audio feedback

#### **Story 5: API Input/Output Logging**
- **ID**: AAC-005
- **Title**: Display live API interactions under game board
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] Real-time API request/response logging
  - [x] Color-coded log types
  - [x] Timestamp display
  - [x] Scrollable log history

#### **Story 6: Comprehensive Testing**
- **ID**: AAC-006
- **Title**: Implement unit tests and test coverage
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] Jest test framework setup
  - [x] API endpoint tests
  - [x] Error handling tests
  - [x] Test coverage reporting

#### **Story 7: Documentation Site**
- **ID**: AAC-007
- **Title**: Create Docusaurus documentation site
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] Docusaurus site setup
  - [x] API documentation
  - [x] Usage instructions
  - [x] Live game integration

#### **Story 8: Error Handling & Edge Cases**
- **ID**: AAC-008
- **Title**: Implement robust error handling
- **Status**: ✅ Completed
- **Acceptance Criteria**:
  - [x] Invalid command handling
  - [x] Audio processing errors
  - [x] Network error handling
  - [x] User-friendly error messages

### 🎯 Total Stories Completed: 8/8 (100%)

## 🔧 Technical Specifications

### **Backend (Node.js)**
- **Framework**: Express.js
- **Port**: 8080
- **Dependencies**: express, multer, cors
- **Python Integration**: SpeechRecognition library

### **Frontend (React)**
- **Framework**: React with Docusaurus
- **Port**: 3000
- **Features**: Voice recognition, Text-to-speech, Real-time logging

### **Testing**
- **Framework**: Jest
- **Coverage**: Supertest for API testing
- **Test Files**: `__tests__/api.test.js`

## 🚀 Deployment Instructions

### Local Development
1. Follow the [Quick Start](#-quick-start) instructions
2. Ensure both servers are running
3. Access the application at the provided URLs

### Production Deployment
1. **Build Documentation**:
   ```bash
   cd documentation
   yarn build
   ```

2. **Deploy API**:
   ```bash
   cd Initial_API
   npm start
   ```

3. **Environment Variables**:
   ```bash
   export ORG_NAME=your-org
   export PROJECT_NAME=aac-api
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: Capstone Projects 2025 Fall
- **Course**: CIS 4398 - Capstone Project
- **Institution**: Temple University

## 📞 Support

For questions or issues:
- **GitHub Issues**: [Create an issue](https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api/issues)
- **Documentation**: [http://localhost:3000/aac-api/](http://localhost:3000/aac-api/)

---

**🎉 Ready to test! Start the servers and play the voice-controlled Tic-Tac-Toe game!**