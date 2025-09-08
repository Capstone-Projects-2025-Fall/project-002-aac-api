---
sidebar_position: 1
---

# System Overview

## Project Abstract
This document proposes a coding API to better allow accessibility in video games. It will allow developers to more easily connect their games to audio-to-text programs, allowing them to manipulate the in-game controls through the use of an AAC machine. On playback the API will run an audio-to-text program on it and check for if the produced text has been set as any possible inputs in the connected game and execute them if found to be true.

## Conceptual Design
The core of the design of the API is to process audio outputs from AAC devices, translate them into game commands, and communicate those commands with games that are built primarily in JavaScript. The API will primariy be using Node.js and possibly Python for audio processing and machine learning. The API will emphasize modularity, as developors can design audio-controlled games wihout directly needing to handle raw inputs from an AAC board and can enable seamless translation into in-game actions. 

## Background
The AAC API will be implemented by game developers looking to support voice input, specifically from the devices of AAC users. The API will negotiate the use of the system microphone, perform speech-to-text, and then return a definitive input to the game logic. Developers can define the words that the API will recognize.

Currently, there are a few AAC tools and assitive systems that support communication and accesibility with AAC devices, such as Microsoft's Xbox Adapative Controller, which is a controller desgined to offer creative input methods for those who are disabled and other software that uses eye-tracking as inputs with users with congnitive or physical disabilityes, but none use the AAC devices to act as game controllers, and more specifially with audio inputs. 
