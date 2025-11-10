---
sidebar_position: 1
---

# System Overview

## Project Abstract
This API allows developers to more easily connect their games to audio-to-text programs, allowing them to control the game with an AAC (Augmnetative and Alternative Communication) input. The API accepts audio files from an AAC device, processes them through speech recognition, and returns structured transcription data that can be mapped to game commands
## Conceptual Design
The API processes audio files from AAC devices or other audio sources, translates them into text via speech recognition, and then returns data that game developers can use to trigger in-game actions. Built with Node.js (Express) and Python (SpeechRecognition library), the API provides a RESTful endpoint that handles audio upload, processing, and transcription with detailed response formatting. 

## Background
The AAC API is implemented by game developers looking to support voice input, specifically from the devices of AAC users. The API processes audio files through Google's Speech Recognition service, making it accessible for developers to integrate voice commands into their games without handling the complexity of audio processsing and speech-to-text conversion

Currently, there are a few AAC tools and assitive systems that support communication and accesibility with AAC devices, such as Microsoft's Xbox Adapative Controller, which is a controller desgined to offer creative input methods for those who are disabled and other software that uses eye-tracking as inputs with users with congnitive or physical disabilites. However, none use the AAC devices to act as game controllers specifically with audio inputs in the way this API enables
