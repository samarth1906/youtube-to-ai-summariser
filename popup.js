const btn = document.getElementById('sendBtn');
const status = document.getElementById('status');

function setStatus(msg, type = '') {
  status.textContent = msg;
  status.className = type;
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  setStatus('Getting current tab...');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url?.includes('youtube.com/watch')) {
    setStatus('Open a YouTube video first.', 'error');
    btn.disabled = false;
    return;
  }

  setStatus('Fetching transcript...');

  const response = await chrome.runtime.sendMessage({
    action: 'PROCESS_VIDEO',
    tabId: tab.id
  });

  if (response?.error) {
    setStatus(response.error, 'error');
    btn.disabled = false;
    return;
  }

  setStatus('Opening Claude...', 'success');
  setTimeout(() => window.close(), 1000);
});
