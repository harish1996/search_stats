// Background service worker
let pendingFeedback = null;
const FEEDBACK_DELAY = 2000; // Wait 2 seconds after navigation before showing popup

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEARCH_RESULT_CLICKED') {
    handleSearchClick(message.domain, message.url, sender.tab.id);
  } else if (message.type === 'SUBMIT_FEEDBACK') {
    handleFeedback(message.domain, message.useful);
  } else if (message.type === 'GET_PENDING_FEEDBACK') {
    sendResponse({ pending: pendingFeedback });
    return true;
  } else if (message.type === 'CLEAR_PENDING_FEEDBACK') {
    pendingFeedback = null;
  }
});

async function handleSearchClick(domain, url, tabId) {
  // Increment click count
  const data = await chrome.storage.local.get(['clickData']);
  const clickData = data.clickData || {};
  
  if (!clickData[domain]) {
    clickData[domain] = {
      clicks: 0,
      useful: 0,
      notUseful: 0,
      lastClicked: null
    };
  }
  
  clickData[domain].clicks++;
  clickData[domain].lastClicked = new Date().toISOString();
  
  await chrome.storage.local.set({ clickData });
  
  console.log('Click recorded for', domain, '- Total clicks:', clickData[domain].clicks);
  
  // Set up pending feedback
  pendingFeedback = { domain, url, timestamp: Date.now() };
  
  // Wait for navigation to complete, then show feedback notification
  setTimeout(() => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      
      // Check if tab has navigated away from Brave Search
      if (!tab.url.includes('search.brave.com')) {
        showFeedbackNotification(tabId, domain);
      }
    });
  }, FEEDBACK_DELAY);
}

function showFeedbackNotification(tabId, domain) {
  // Inject feedback UI into the page
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['feedback.js']
  }).catch(err => {
    console.log('Could not inject feedback script:', err);
  });
}

async function handleFeedback(domain, useful) {
  const data = await chrome.storage.local.get(['clickData']);
  const clickData = data.clickData || {};
  
  if (clickData[domain]) {
    if (useful) {
      clickData[domain].useful++;
    } else {
      clickData[domain].notUseful++;
    }
    
    await chrome.storage.local.set({ clickData });
    console.log('Feedback recorded for', domain);
  }
  
  pendingFeedback = null;
}