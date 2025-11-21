<div align="center">

# Project Name
[![Report Issue on Jira](https://img.shields.io/badge/Report%20Issues-Jira-0052CC?style=flat&logo=jira-software)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/DT/issues)
[![Deploy Docs](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml/badge.svg)](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml)
[![Documentation Website Link](https://img.shields.io/badge/-Documentation%20Website-brightgreen)](https://capstone-projects-2025-fall.github.io/project-002-aac-api/)


</div>


## Keywords

Section 2, API, programming language as of yet undefined

## Project Abstract

This document proposes a coding API to better allow accessibility in video games. It will allow developers to more easily connect their games to audio-to-text programs, allowing them to manipulate the in-game controls through the use of an AAC machine. On playback the API will run an audio-to-text program on it and check for if the produced text has been set as any possible inputs in the connected game and execute them if found to be true.

## High Level Requirement

This api will be control the in between communications between games and the users AAC machine, allowing for control of the game purely with audio playback.

## Conceptual Design

Currently undecided

## Background

More research is needed

## Required Resources

More research is needed

## Collaborators

<div align="center">

[//]: # (Replace with your collaborators)
[Giovanni Muniz] • [Andrew Blass] • [Eric Smith] • [Kieran Plenn] • [Mohammad Eisa]

</div>

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
