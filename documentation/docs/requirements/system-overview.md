---
sidebar_position: 1
---

# System Overview

## Project Abstract
This document proposes a coding API to better allow accessibility in video games. It will allow developers to more easily connect their games to audio-to-text programs, allowing them to manipulate the in-game controls through the use of an AAC machine. On playback the API will run an audio-to-text program on it and check for if the produced text has been set as any possible inputs in the connected game and execute them if found to be true.

## Conceptual Design
In Progress

## Background
The AAC API will be implemented by game developers looking to support voice input, specifically from the devices of AAC users. The API will negotiate the use of the system microphone, perform speech-to-text, and then return a definitive input to the game logic. Developers can define the words that the API will recognize.
