// Feedback UI injected into pages
(function() {
  'use strict';
  
  // Check if feedback UI already exists
  if (document.getElementById('brave-tracker-feedback')) {
    return;
  }
  
  // Get pending feedback info
  chrome.runtime.sendMessage({ type: 'GET_PENDING_FEEDBACK' }, (response) => {
    if (!response || !response.pending) return;
    
    const { domain } = response.pending;
    
    // Create feedback container
    const container = document.createElement('div');
    container.id = 'brave-tracker-feedback';
    container.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 2px solid #4a90e2;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      ">
        <style>
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
          .brave-tracker-btn {
            padding: 8px 16px;
            margin: 0 4px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .brave-tracker-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          .brave-tracker-useful {
            background: #4caf50;
            color: white;
          }
          .brave-tracker-not-useful {
            background: #f44336;
            color: white;
          }
          .brave-tracker-close {
            background: transparent;
            color: #666;
            padding: 4px 8px;
            font-size: 12px;
          }
        </style>
        <div style="margin-bottom: 12px; font-size: 14px; color: #333;">
          <strong>Was this result useful?</strong>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${domain}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <button class="brave-tracker-btn brave-tracker-useful" data-useful="true">
              👍 Yes
            </button>
            <button class="brave-tracker-btn brave-tracker-not-useful" data-useful="false">
              👎 No
            </button>
          </div>
          <button class="brave-tracker-btn brave-tracker-close" data-close="true">
            ✕
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Handle button clicks
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      if (btn.dataset.close !== undefined) {
        // Close without feedback
        closeNotification(container);
        chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_FEEDBACK' });
      } else if (btn.dataset.useful !== undefined) {
        const useful = btn.dataset.useful === 'true';
        
        // Send feedback
        chrome.runtime.sendMessage({
          type: 'SUBMIT_FEEDBACK',
          domain: domain,
          useful: useful
        });
        
        // Show thank you message briefly
        container.firstElementChild.innerHTML = `
          <div style="text-align: center; padding: 8px; color: #4caf50; font-weight: 500;">
            ✓ Thank you for your feedback!
          </div>
        `;
        
        setTimeout(() => {
          closeNotification(container);
        }, 1500);
      }
    });
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (document.getElementById('brave-tracker-feedback')) {
        closeNotification(container);
        chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_FEEDBACK' });
      }
    }, 15000);
  });
  
  function closeNotification(container) {
    container.firstElementChild.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      container.remove();
    }, 300);
  }
})();