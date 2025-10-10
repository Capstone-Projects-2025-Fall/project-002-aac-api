---
sidebar_position: 1
---

# System Overview

## Project Abstract
This API enables developers to connect their games to AAC devices using audio input. It converts speech from the AAC device into text, matches it against predefined commands, and executes corresponding in-game actions.  

## Conceptual Design
The API processes audio from AAC devices, translates it into game commands, and communicates with games built in JavaScript. Node.js handles the server-side integration, while Python is used for audio processing and machine learning components. The API is modular, allowing developers to implement audio-controlled gameplay without handling low-level AAC board input.

---

## Background
Game developers aiming to support AAC voice input can use this API to access the system microphone, perform speech-to-text conversion, and feed recognized inputs into game logic. Developers define the set of words or phrases the API recognizes, enabling customized gameplay experiences.  

Existing AAC tools and assistive systems, such as Microsoft's Xbox Adaptive Controller or eye-tracking software for users with cognitive or physical disabilities, provide alternative input methods. However, none allow AAC devices to act as full game controllers using **audio input**. This API fills that gap, enabling seamless AAC-controlled gameplay.
