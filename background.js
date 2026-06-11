const PROMPT_PREFIX = `Please analyze this YouTube video transcript. Provide:
1. A summary covering the main content (as long as needed to cover the key material)
2. Key points and main ideas
3. Any important insights or takeaways
4. Fact-check: Identify the main factual claims or arguments made in the video and evaluate whether they hold up - note anything that seems exaggerated, misleading, outdated, or contradicted by well-established information
5. Counterarguments: For the video's central argument or thesis, research and present the strongest counterarguments or alternative perspectives, if applicable
6. Verdict: Based on the above, is this video worth watching? Briefly explain why or why not

Transcript:
`;

const TARGET_URLS = {
  claude:  'https://claude.ai/new',
  gemini:  'https://gemini.google.com/',
  chatgpt: 'https://chatgpt.com/'
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PROCESS_VIDEO') {
    const tabId = message.tabId ?? sender.tab?.id;
    processVideo(tabId, message.target || 'claude').then(sendResponse);
    return true;
  }
});

async function processVideo(tabId, target = 'claude') {
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractAndFetchTranscript,
      world: 'MAIN'
    });
  } catch (e) {
    return { error: 'Script inject failed: ' + e.message };
  }

  const result = results?.[0]?.result;
  console.log('[YT→Claude] result:', result);

  if (!result) return { error: 'Could not read page. Refresh YouTube and try again.' };
  if (result.error) return { error: result.error };
  if (!result.transcript) return { error: 'Transcript was empty.' };

  const prompt = PROMPT_PREFIX + result.transcript;
  await chrome.storage.local.set({ pendingPrompt: prompt });
  await chrome.tabs.create({ url: TARGET_URLS[target] || TARGET_URLS.claude });

  return { success: true };
}

// Runs inside the YouTube tab (MAIN world) — has page cookies & session context
async function extractAndFetchTranscript() {
  // --- Approach 1: use the caption track URL from ytInitialPlayerResponse ---
  try {
    const tracks = window.ytInitialPlayerResponse
      ?.captions
      ?.playerCaptionsTracklistRenderer
      ?.captionTracks;

    if (tracks?.length) {
      const track = tracks.find(t => t.languageCode?.startsWith('en')) || tracks[0];
      const sep = track.baseUrl.includes('?') ? '&' : '?';
      const url = track.baseUrl + sep + 'fmt=json3';
      const r = await fetch(url);
      const text = await r.text();
      const json = JSON.parse(text);
      const transcript = json.events
        ?.filter(e => e.segs)
        .map(e => e.segs.map(s => s.utf8 ?? '').join(''))
        .filter(t => t.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (transcript) return { transcript };
    }
  } catch (_) {
    // fall through to DOM approach
  }

  // --- Approach 2: click the UI buttons and read DOM text ---
  const delay = ms => new Promise(r => setTimeout(r, ms));

  const waitFor = (selector, timeout = 8000) => new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { obs.disconnect(); resolve(found); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
  });

  const isOpen = () =>
    document.querySelector('transcript-segment-view-model') ||
    document.querySelector('ytd-transcript-segment-renderer');

  if (!isOpen()) {
    let transcriptBtn = document.querySelector('button[aria-label="Show transcript"]');

    if (!transcriptBtn) {
      const expandBtn = document.querySelector('tp-yt-paper-button#expand');
      if (expandBtn && !expandBtn.hasAttribute('hidden')) {
        expandBtn.click();
        await delay(800);
        transcriptBtn = document.querySelector('button[aria-label="Show transcript"]');
      }
    }

    if (!transcriptBtn) {
      return { error: 'Could not find the "Show transcript" button on this page.' };
    }

    transcriptBtn.click();
    await waitFor('transcript-segment-view-model, ytd-transcript-segment-renderer');
    await delay(600);
  }

  function readSegments() {
    // New YouTube UI (Kevlar)
    const newSegs = document.querySelectorAll('transcript-segment-view-model');
    if (newSegs.length) {
      return Array.from(newSegs)
        .map(seg => seg.querySelector('span.ytAttributedStringHost')?.textContent?.trim() || '')
        .filter(t => t);
    }

    // Legacy YouTube UI
    const oldSegs = document.querySelectorAll('ytd-transcript-segment-renderer');
    const texts = [];
    oldSegs.forEach(seg => {
      const roots = [seg.shadowRoot, seg].filter(Boolean);
      for (const root of roots) {
        const el = root.querySelector('yt-formatted-string.segment-text, .segment-text');
        if (el) { texts.push(el.textContent?.trim() || ''); break; }
      }
    });
    return texts.filter(t => t);
  }

  let texts = readSegments();
  if (!texts.length) {
    await delay(1500);
    texts = readSegments();
  }

  if (!texts.length) {
    return { error: 'Transcript panel opened but no text was found.' };
  }

  return { transcript: texts.join(' ') };
}
