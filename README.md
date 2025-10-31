# 🎤 AAC API - Voice Tic-Tac-Toe Game

A simple voice-controlled Tic-Tac-Toe game that uses speech recognition

Step 1: Download the Project
```bash
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git
cd project-002-aac-api
```

Step 2: Install Stuff
```bash
# Install API stuff
cd Initial_API
npm install

# Install website stuff
cd ../documentation
yarn install

# Install Python stuff
pip3 install SpeechRecognition
```

Step 3: Start the Game

Terminal 1 (Website):
```bash
cd documentation
yarn start
```

Terminal 2 (API):
```bash
cd Initial_API
node .
```

Step 4: Play the Game
1. Go to: http://localhost:3000/aac-api/tic-tac-toe
2. Click "Record Command" 
3. Say "center" or "top left" or "bottom right"

How to Play

Voice Commands:
- **"center"** - Put X or O in the middle
- **"top left"** - Put X or O in top left corner
- **"bottom right"** - Put X or O in bottom right corner
- **"new game"** - Start over

What You'll See:
- Game board with X's and O's
- API logs showing what's happening
- Audio announcements telling you what's going on

If Something Breaks:

"Cannot find module" error:
```bash
cd Initial_API
npm install
```

"Port already in use" error:
```bash
# Kill everything and try again
pkill -f "node"
pkill -f "docusaurus"
```

"Permission denied" for microphone:
- Allow microphone access in your browser
- Chrome: Settings > Privacy > Microphone
- Firefox: Settings > Privacy > Permissions

Python errors:
```bash
pip3 install SpeechRecognition
```
