# Debugging Guide

## If the paste into Claude / Gemini / ChatGPT stops working

Open that AI site in Chrome, press **F12**, go to **Console**, run:

```javascript
document.querySelectorAll('[contenteditable="true"]').forEach((el, i) => {
  console.log(i, el.tagName, el.className, el.id, el.offsetWidth, el.offsetHeight);
});
```

Paste the output to Claude Code and say **"the [Claude/Gemini/ChatGPT] paste stopped working"**.

---

## If the transcript stops being fetched

Open a YouTube video, press **F12**, go to **Console**, run:

```javascript
console.log(!!window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks);
```

- If it says **`true`** — the API is fine, the DOM selectors probably changed
- If it says **`false`** — YouTube changed their internal data structure

Either way, paste the result and say **"the transcript fetch stopped working"**.

---

## If the widget disappears from the YouTube sidebar

YouTube updates their page layout regularly. Open a YouTube video, press **F12**, go to **Console**, run:

```javascript
console.log('secondary-inner:', !!document.querySelector('#secondary-inner'));
```

- If it says **`false`** — the sidebar container was renamed. Run this to find the new one:

```javascript
document.querySelector('ytd-watch-next-secondary-results-renderer')
  ?.parentElement?.id;
```

Paste the result and say **"the widget isn't appearing in the sidebar"**.

---

## General rule

The extension breaks for one reason: **YouTube or the AI sites updated their HTML and renamed something**. The fix is always fast — usually changing one or two selector strings in a single file. Just tell me which feature broke and paste the console output.
