---
sidebar_position: 2
---

# System Block Diagram

![Block_Diagram_3](https://github.com/user-attachments/assets/c84247fd-afd1-448b-a94d-c6ecdc6219a4)

# Description

The diagram demononstrates two primary user types and their methods:

<b>AAC Keyboard Users</b> utilize specialized communication devices (shown as a tablet with a grid-based interface) to select words or phrases from their device. In the diagram, the AAC user selects "Apple" from their device, which is then transmitted as audio output to the system microphone. This pathway highlights how individuals who rely on AAC devices for communication can interact with games using their existing assistive technology. 

<b>Verbal Communication Users</b> represent the traditional input methods, where users speak directly into the microphone. In the diagram, the user speaks the word "Grape" naturally by mouth, which demonstrates that the API supports both AAC-generated speech and natural human speech

The central component of the system is the API, which serves as the middleware between audio input and the game logic. The API performs audio capture, which receives input from the microphone, speech-to-text conversion, which processes the audio and converts it into recognized text, which in the diagram is reprensted as "Apple" and "Grape" being extracted as words from the audio stream, and command matching, which compares the recongnized words against the predefined input options available in the game. When a match is found, the API sends the corresponding command to the game application.

The diagram illustrates how the API bridges the gap between assistive communication technology and game logic, which creates an accessible gaming ecosystem for users of all abilities. 
