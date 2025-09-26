---
sidebar_position: 1
---

**Purpose**

The Design Document - Part I Architecture describes the software architecture and how the requirements are mapped into the design. This document will be a combination of diagrams and text that describes what the diagrams are showing.

**Requirements**

In addition to the general requirements the Design Document - Part I Architecture will contain:

A description the different components and their interfaces. For example: client, server, database.

For each component provide class diagrams showing the classes to be developed (or used) and their relationship.

Sequence diagrams showing the data flow for _all_ use cases. One sequence diagram corresponds to one use case and different use cases should have different corresponding sequence diagrams.

Describe algorithms employed in your project, e.g. neural network paradigm, training and training data set, etc.

If there is a database:

Entity-relation diagram.

Table design.

A check list for architecture design is attached here [architecture\_design\_checklist.pdf](https://templeu.instructure.com/courses/106563/files/16928870/download?wrap=1 "architecture_design_checklist.pdf")  and should be used as a guidance.

```mermaid
sequenceDiagram
  participant Game as Game;
  participant Library as Library;
  Actor User as User;
  participant API as API;
  participant OS Audio as OS Audio;
  participant UI as UI;

  activate Game;
  Game ->> Library: requestInput(data);
  Library ->> User: requestAudio(audio input);
  activate Library;
  User -->> Library: Returns audio input;
  Library ->> API: translateThis(audio input);
  
  activate API;
  API ->> OS Audio: translateThis(audio input);
  activate OS Audio;
  OS Audio -->> API: data(translatedString);
  deactivate OS Audio;
  API -->> Library: data(translatedString);
  deactivate API;
  Library ->> Game: requestedInput(input);
  deactivate Library;
  Game ->> UI: data(visualConfirmation);
  deactivate Game;
```






