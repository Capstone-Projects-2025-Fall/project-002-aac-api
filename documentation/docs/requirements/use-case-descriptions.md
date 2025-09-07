---
sidebar_position: 5
---

# Use-case descriptions
### Use Case 1 - AAC Accessible Game Development
<i>As a game developer, I want to be able to use the API to easily convert sound from an AAC board to game inputs for a character to move</i>
1. The developer imports the API and all of its functions.
2. The developer creates a bucket list of words, such as "move left", "move right", and "move up," for their game.
3. The developer uses the bucket list as arguments for any of the given functions from the API.
4. The functions then hear audio from the AAC board and use algorithms to sort the words from the bucket list into a desired movement output.
5. The functions return a word.
6. The developer then maps the words to game inputs, which are used for a character within their game to be able to move.

### Use Case 2 - AAC Board User Gameplay
<i>As an AAC Board user, I want to be able to play games with other people with my voice</i>
1. The user connects their board to the game.
2. The user then joins a multiplayer game with other users who are on different input devices.
3. The user uses their voice to be able to control any input within the game.
4. The user is able to play alongside other users simultaneously.

### Use Case 3 – Educational Application
<i>As an educator, I want to ensure fun ways to teach and engage students who depend on AAC devices</i>
1. The teacher selects a game that supports the AAC API.
2. The student issues voice commands through the AAC board during gameplay.
3. The game responds to the commands, rewarding progress or advancing the activity.
4. The teacher observes the student’s performance and provides encouragement or feedback.
5. The student is able to practice speech while staying engaged with the game.

### Use Case 4 – AAC Board Customizability Access
<i>As a game developer, I want to customize the set of AAC voice commands supported by the API so that I can adapt them to different genres of games</i>
1. The developer imports the API into their project.
2. The developer defines a new command set tailored for their game, such as “accelerate,” “brake,” and “boost” for a racing game.
3. The API listens for AAC inputs and interprets them according to the customized command set.
4. The developer associates each command with the appropriate in-game function.
5. As the game is running, the commands are translated into the corresponding in-game actions.
6. The developer can expand or edit the command set in future updates to refine gameplay.

### Use Case 5 – Non-Compatible Game Refactoring
<i>As a game developer, I want to refactor my existing game to use the API so that players with AAC boards can control the game without traditional input devices.</i>
1. The developer imports the API into their existing codebase.
2. The developer identifies sections of the code that currently take keyboard or controller input.
3. The developer replaces those input calls with functions from the API that capture AAC voice commands.
4. The developer tests the game to confirm that AAC inputs are correctly mapped to game mechanics.
5. The developer deploys the updated version of the game.
6. Players are now able to use AAC voice input seamlessly in a game that originally only supported standard controls.
