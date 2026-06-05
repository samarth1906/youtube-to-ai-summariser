async function run() {
  const data = await chrome.storage.local.get('pendingPrompt');
  if (!data.pendingPrompt) return;
  await chrome.storage.local.remove('pendingPrompt');

  const editor = await waitForElement('#prompt-textarea, div[contenteditable="true"]');
  if (!editor) return;

  await delay(500);
  editor.focus();

  const dt = new DataTransfer();
  dt.setData('text/plain', data.pendingPrompt);
  editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));

  await delay(800);
  const sendBtn = document.querySelector(
    'button[data-testid="send-button"], button[aria-label="Send prompt"], button[aria-label="Send message"]'
  );
  if (sendBtn && !sendBtn.disabled) sendBtn.click();
}

function waitForElement(selector, timeout = 15000) {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));
run();
