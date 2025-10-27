# What's Changed

**Initialize API** by @tuk45167 in #1
**Update API page to specify which folder to navigate to** by @MohammadEisa in #2
**Refactor Speech recognition to server side** by @GiovanniMuniz in #3
**Return text output in API. CLI for now** by @tuk45167 in #4
**Create rudimentary game to test API (Tic-Tac-Toe?)** by @ShrikanthSrenivas in #5
**Integrate the API with audio** by @tuk45167 in #6
**Look into Dev Ops for automated testing** by @ShrikanthSrenivas in #7
**Return words to api (from speech engine)** by @ShrikanthSrenivas in #8
**Add client-facing functions to the API** by @GiovanniMuniz in #9
**Conceptualize the API functions** by @EricSmith in #10
**Look more into API frameworks** by @KieranPlenn in #11
**Connect the API to a game element to verify input** by @ShrikanthSrenivas in #12
**Create Documentation for Test** by @KieranPlenn in #13
**Update/Create Documentation for API** by @ShrikanthSrenivas in #14
**Integrate the speech recognition file into the API** by @GiovanniMuniz in #15
**Integrate SwaggerDocs into Docusaurus** by @GiovanniMuniz in #16
**Add (automated) testing** by @MohammadEisa in #17
**Read Hungry Hungry Hippos Documentation** by @KieranPlenn in #18
**Read OrderUp Docs** by @MohammadEisa in #19
**Choose an AAC board for testing** by @MohammadEisa in #20
**Decide Local or Cloud processing** by @ShrikanthSrenivas in #21
**Decide Language** by @ShrikanthSrenivas in #22
**Read StoryQuest Doc** by @ShrikanthSrenivas in #23
**Read Scribblers Docs** by @GiovanniMuniz in #24
**Confirm system microphone access on Windows with CLI** by @ShrikanthSrenivas in #25
**Add start and stop recording functions to API** by @ShrikanthSrenivas in #26
**Edit our tic-tac-toe game to call API (local)** by @MohammadEisa in #27
**Add command to stop running API** by @MohammadEisa in #28

## New Contributors
@tuk45167 made their first contribution in #1
@MohammadEisa made their first contribution in #2
@GiovanniMuniz made their first contribution in #3
@EricSmith made their first contribution in #10
@KieranPlenn made their first contribution in #11

## Full Changelog: Initial Release...v1.0.0

## Contributors
@tuk45167 @MohammadEisa @GiovanniMuniz @ShrikanthSrenivas @EricSmith @KieranPlenn

## Assets
- Source code (zip)
- Source code (tar.gz)

---

## Jira Stories Completed (28/28 - 100%)

| Story Key | Summary | Sprint | Assignee |
|-----------|---------|--------|----------|
| AAC-7, AP2-19 | Initialize API | AP2 Sprint 2 | tuk45167 |
| AP2-42 | Update API page to specify which folder to navigate to | AP2 Sprint 3 | Mohammad Eisa |
| AP2-40 | Refactor Speech recognition to server side | AP2 Sprint 3 | Giovanni Muniz |
| AP2-15, AP2-9 | Return text output in API. CLI for now | AP2 Sprint 3 | tuk45167 |
| AP2-15, AP2-32 | Create rudimentary game to test API (Tic-Tac-Toe?) | AP2 Sprint 2 | Shrikanth Srenivas |
| AP2-35 | Integrate the API with audio | AP2 Sprint 3 | tuk45167 |
| AP2-34 | Look into Dev Ops for automated testing | AP2 Sprint 2 | Shrikanth Srenivas |
| AAC-18, AP2-12 | Return words to api (from speech engine) | AP2 Sprint 3 | Shrikanth Srenivas |
| AP2-39 | Add client-facing functions to the API | AP2 Sprint 3 | Giovanni Muniz |
| AP2-37 | Conceptualize the API functions | AP2 Sprint 3 | Eric Smith |
| AP2-36 | Look more into API frameworks | AP2 Sprint 3 | Kieran Plenn |
| AAC-18, AP2-18 | Connect the API to a game element to verify input | AP2 Sprint 2 | Shrikanth Srenivas |
| AP2-33 | Create Documentation for Test | AP2 Sprint 2 | Kieran Plenn |
| AP2-17, AP2-29 | Update/Create Documentation for API | AP2 Sprint 2 | Shrikanth Srenivas |
| AP2-15, AP2-1 | Integrate the speech recognition file into the API | AP2 Sprint 3 | Giovanni Muniz |
| AP2-15, AP2-16 | Integrate SwaggerDocs into Docusaurus | AP2 Sprint 2 | Giovanni Muniz |
| AAC-18, AP2-27 | Add (automated) testing | AP2 Sprint 2 | Mohammad Eisa |
| AAC-18, AP2-23 | Read Hungry Hungry Hippos Documentation | AP2 Sprint 1 | Kieran Plenn |
| AAC-18, AP2-24 | Read OrderUp Docs | AP2 Sprint 1 | Mohammad Eisa |
| AP2-17, AP2-31 | Choose an AAC board for testing | AP2 Sprint 1 | Mohammad Eisa |
| AP2-17, AP2-22 | Decide Local or Cloud processing | AP2 Sprint 1 | Shrikanth Srenivas |
| AP2-17, AP2-21 | Decide Language | AP2 Sprint 1 | Shrikanth Srenivas |
| AAC-18, AP2-25 | Read StoryQuest Doc | AP2 Sprint 1 | Shrikanth Srenivas |
| AAC-18, AP2-26 | Read Scribblers Docs | AP2 Sprint 1 | Giovanni Muniz |
| AP2-15, AP2-2 | Confirm system microphone access on Windows with CLI | AP2 Sprint 1 | Shrikanth Srenivas |
| AP2-15, AP2-7 | Add start and stop recording functions to API | AP2 Sprint 1 | Shrikanth Srenivas |
| AP2-44 | Edit our tic-tac-toe game to call API (local) | AP2 Sprint 3 | Mohammad Eisa |
| AP2-43 | Add command to stop running API | AP2 Sprint 3 | Mohammad Eisa |

**Total Stories**: 28 completed  
**Sprints**: AP2 Sprint 1, AP2 Sprint 2, AP2 Sprint 3

## Quick Start

```bash
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git
cd project-002-aac-api
cd Initial_API && npm install
cd ../documentation && yarn install
pip3 install SpeechRecognition

# Terminal 1:
cd documentation
ORG_NAME=your-org PROJECT_NAME=aac-api yarn start --host 0.0.0.0

# Terminal 2:
cd Initial_API
node .

# Play: http://localhost:3000/aac-api/tic-tac-toe
```

Perfect for classroom demonstration and QA testing!