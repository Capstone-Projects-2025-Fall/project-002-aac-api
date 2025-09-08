---
sidebar_position: 4
---

# Features and Requirements

## Functional Requirements
<ul>
  <li>API must take in preset audio input options it is expecting</li>
  <li>API must connect to, activate, and record audio from microphone</li>
  <li>API must connect to speech-to-text database (either internal or external)</li>
  <li>API must translate recorded audio into text</li>
  <li>API must compare translated audio input to input options and record if it is included in the list, and which one if it is</li>
  <li>API must return comparison results</li>
  <li>API must be compatible with any suitable AAC device</li>
</ul>

## Non-Functional Requirements
<ul>
  <li>API should respond quickly to inputs so users don’t feel lag</li>
  <li>API should be flexible enough to support new AAC devices in the future</li>
  <li>API should be able to handle multiple developer requests at once</li>
  <li>API should be able to process concurrent audio inputs</li>
  <li>API should give feedback so users know their action was received</li>
  <li>API should have flexibility for future use-cases</li>
  <li>API should keep data secure</li>
</ul>
