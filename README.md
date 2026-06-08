# YouTube to AI Summarizer

A lightweight Chrome extension that extracts YouTube transcripts and sends them to your AI chat of choice — so you can summarise any video in seconds without watching it.

## Why

Long YouTube videos often contain 5 minutes of useful content buried in an hour of runtime. This extension pulls the transcript and drops it straight into Gemini, Claude, ChatGPT, or any other LLM chat — no copy-pasting, no fuss.

## How it works

1. Open any YouTube video
2. Click the extension icon
3. The transcript is extracted and pasted into your chosen AI chat
4. Ask for a summary, key points, or anything else

## Features

- Extracts YouTube auto-generated and manual captions
- Works with any LLM chat interface (Gemini, Claude, ChatGPT, etc.)
- No backend — runs entirely in the browser
- No data stored or sent anywhere except your chosen AI chat

## Installation

> Not yet on the Chrome Web Store — install manually:

1. Clone or download this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## Tech stack

- JavaScript
- Chrome Extensions API (Manifest V3)
- YouTube transcript/caption extraction via DOM

## Contributing

Open to issues and PRs. Built as a solo side project — feedback welcome.

## License

MIT
