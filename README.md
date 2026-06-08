# YouTube to AI Summarizer

A Chrome extension that extracts YouTube transcripts and lets you summarise them with any LLM Claude, ChatGPT, Gemini, or whatever you prefer. Includes a built-in chat so your summaries and conversations are saved and stored.

## Why

YouTube has a built-in AI summary feature powered by Gemini. It's not great. The summaries are shallow, you can ask limited follow-up questions, and you're locked into one model with no way to switch.

This extension fixes that, extract the transcript and send it to whichever AI you actually want to use, then continue the conversation in a persistent chat that stores your history.

## How it works

1. Open any YouTube video
2. Click the extension icon
3. The transcript is extracted and loaded into the built-in chat
4. Choose your preferred LLM and ask anything — summary, key points, deep dive
5. Your chats are saved so you can come back to them later

## Features

- Extracts YouTube captions and transcripts
- Works with any LLM — not locked to Gemini
- Built-in chat interface with persistent history
- No backend — runs entirely in the browser

## Installation

1. Clone or download this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## Tech stack

- JavaScript
- Chrome Extensions API (Manifest V3)
- YouTube transcript extraction via DOM

## License

MIT
