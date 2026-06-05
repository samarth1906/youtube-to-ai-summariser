# YouTube Summarizer Chrome Extension

## What this does
A Chrome extension that extracts a YouTube video's transcript and sends it to an AI for summarization. A widget appears in the YouTube sidebar (above recommended videos) with three buttons: **Summarize with Claude**, **Summarize with Gemini**, **Summarize with ChatGPT**. Clicking any button opens the chosen AI in a new tab and automatically pastes the transcript with a summarization prompt.

## File structure

```
background.js                  — Core logic: transcript extraction + routing to AI
manifest.json                  — Extension config, permissions, content script registration
popup.html / popup.css / popup.js — Toolbar popup (secondary UI, mostly redundant)
icon16/48/128.png              — Extension icon (purple square, white lightning bolt)
content_scripts/
  youtube.js                   — Injects the widget into the YouTube sidebar
  claude.js                    — Pastes transcript into Claude (claude.ai)
  gemini.js                    — Pastes transcript into Gemini (gemini.google.com)
  chatgpt.js                   — Pastes transcript into ChatGPT (chatgpt.com)
DEBUGGING.md                   — Console commands to diagnose breakages
```

## How transcript extraction works
`background.js` uses two approaches in order:
1. **API approach** — reads `window.ytInitialPlayerResponse.captions` (YouTube's internal JS object) and fetches the caption track URL directly. Fast, no UI interaction.
2. **DOM fallback** — clicks the "Show transcript" button on the page and reads text from `transcript-segment-view-model` elements (YouTube's new Kevlar UI).

## How AI pasting works
Each content script (`claude.js`, `gemini.js`, `chatgpt.js`) runs when the AI tab opens, reads the transcript from `chrome.storage.local`, and pastes it into the input box using a `ClipboardEvent` paste or `execCommand('insertText')`. Each AI site requires different selectors and methods:
- **Claude** — `div[contenteditable="true"]`, ClipboardEvent paste
- **Gemini** — `div.ql-editor` (Quill editor), execCommand insertText
- **ChatGPT** — `#prompt-textarea`, ClipboardEvent paste

## Key decisions made
- `chrome.storage.local` is used to pass the transcript between the YouTube tab and the AI tab (`chrome.storage.session` threw an error in content scripts)
- The widget is injected into `#secondary-inner` (YouTube's sidebar container) as the first child, above recommended videos
- YouTube's new UI uses `transcript-segment-view-model` elements — the old `ytd-transcript-segment-renderer` selectors no longer work
- A `MutationObserver` handles the case where `#secondary-inner` isn't in the DOM yet when the script first runs

## Most likely things to break
- AI sites update their input box HTML → paste stops working → see DEBUGGING.md
- YouTube updates their page layout → widget disappears or transcript fails → see DEBUGGING.md

## Current version
- v1.1
- All three AIs working: Claude ✓, Gemini ✓, ChatGPT ✓
- Transcript extraction working via API + DOM fallback
