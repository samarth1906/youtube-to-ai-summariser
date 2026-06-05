async function run() {
  const data = await chrome.storage.local.get('pendingPrompt');
  if (!data.pendingPrompt) return;
  await chrome.storage.local.remove('pendingPrompt');

  const editor = await waitForElement('div.ql-editor');
  if (!editor) return;

  await delay(600);

  // Click then focus so the browser registers real focus on the element
  editor.click();
  editor.focus();
  await delay(200);

  // execCommand works reliably with Quill
  document.execCommand('insertText', false, data.pendingPrompt);
  await delay(300);

  // Fallback: paste event
  if (!editor.textContent.trim()) {
    const dt = new DataTransfer();
    dt.setData('text/plain', data.pendingPrompt);
    editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    await delay(300);
  }

  const sendBtn = document.querySelector(
    'button.send-button, button[aria-label="Send message"], button[data-mat-icon-name="send"], button[jsname="Jh9lGc"]'
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
