async function run() {
  const data = await chrome.storage.local.get('pendingPrompt');
  if (!data.pendingPrompt) return;

  await chrome.storage.local.remove('pendingPrompt');

  const editor = await waitForElement('div[contenteditable="true"]');
  if (!editor) return;

  await delay(400);
  editor.focus();

  // Simulate a paste event — works with React/ProseMirror editors
  const dt = new DataTransfer();
  dt.setData('text/plain', data.pendingPrompt);
  editor.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData: dt,
    bubbles: true,
    cancelable: true
  }));

  await delay(600);

  const sendBtn = findSendButton();
  if (sendBtn) sendBtn.click();
}

function findSendButton() {
  const selectors = [
    'button[aria-label="Send Message"]',
    'button[aria-label="Send message"]',
    'button[data-testid="send-button"]',
    'fieldset button[type="submit"]',
    'form button[type="submit"]'
  ];
  for (const sel of selectors) {
    const btn = document.querySelector(sel);
    if (btn && !btn.disabled) return btn;
  }
  return null;
}

function waitForElement(selector, timeout = 15000) {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

run();
