# 🎤 AAC API - Voice Tic-Tac-Toe Game

A simple voice-controlled Tic-Tac-Toe game that uses speech recognition!

## 🚀 How to Run (Super Easy!)

### Step 1: Download the Project
```bash
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git
cd project-002-aac-api
```

### Step 2: Install Stuff
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

### Step 3: Start the Game
Open **2 terminal windows**:

**Terminal 1 (Website):**
```bash
cd documentation
ORG_NAME=your-org PROJECT_NAME=aac-api yarn start --host 0.0.0.0
```

**Terminal 2 (API):**
```bash
cd Initial_API
node .
```

### Step 4: Play the Game!
1. Go to: http://localhost:3000/aac-api/tic-tac-toe
2. Click "Record Command" 
3. Say "center" or "top left" or "bottom right"
4. Watch the magic happen! 🎉

## 🎮 How to Play

### Voice Commands:
- **"center"** - Put X or O in the middle
- **"top left"** - Put X or O in top left corner
- **"bottom right"** - Put X or O in bottom right corner
- **"new game"** - Start over
- **"1", "2", "3"...** - Use numbers 1-9

### What You'll See:
- Game board with X's and O's
- API logs showing what's happening
- Audio announcements telling you what's going on

## 🐛 If Something Breaks

### "Cannot find module" error:
```bash
cd Initial_API
npm install
```

### "Port already in use" error:
```bash
# Kill everything and try again
pkill -f "node"
pkill -f "docusaurus"
```

### "Permission denied" for microphone:
- Allow microphone access in your browser
- Chrome: Settings > Privacy > Microphone
- Firefox: Settings > Privacy > Permissions

### Python errors:
```bash
pip3 install SpeechRecognition
```

## 📁 What's in This Project

```
project-002-aac-api/
├── Initial_API/          # The backend server
│   ├── index.js         # Main server file
│   └── speech2.py       # Python speech stuff
├── documentation/        # The website
│   └── src/components/TicTacToe/  # The game!
└── README.md            # This file
```

## 🎯 What This Project Does

1. **Records your voice** when you click "Record Command"
2. **Sends audio to Python** to convert speech to text
3. **Plays the game** based on what you said
4. **Shows you everything** that's happening in real-time
5. **Talks back to you** with audio announcements

## 🧪 Testing

Want to test if everything works?

```bash
# Test the API
curl http://localhost:8080/test

# Should return: {"name":"Test1","status":"test"}
```

## 🎓 For Students

This project shows:
- **React** for the frontend game
- **Node.js** for the API server
- **Python** for speech recognition
- **Real-time communication** between frontend and backend
- **Voice control** and accessibility features

## 📞 Need Help?

- Check the terminal for error messages
- Make sure both servers are running
- Try refreshing the browser
- Check if your microphone is working

## 🎉 That's It!

You now have a working voice-controlled Tic-Tac-Toe game! 

**Game URL**: http://localhost:3000/aac-api/tic-tac-toe

Have fun! 🎮