// Popup script
async function loadStats() {
  const data = await chrome.storage.local.get(['clickData']);
  const clickData = data.clickData || {};
  
  const domains = Object.keys(clickData);
  let totalClicks = 0;
  let totalAppearances = 0;
  let totalUseful = 0;
  let totalNotUseful = 0;
  
  domains.forEach(domain => {
    totalClicks += clickData[domain].clicks;
    totalAppearances += clickData[domain].appearances || 0;
    totalUseful += clickData[domain].useful;
    totalNotUseful += clickData[domain].notUseful;
  });
  
  // Update summary stats
  document.getElementById('total-clicks').textContent = totalClicks;
  document.getElementById('total-appearances').textContent = totalAppearances;
  document.getElementById('unique-domains').textContent = domains.length;
  document.getElementById('total-useful').textContent = totalUseful;
  document.getElementById('total-not-useful').textContent = totalNotUseful;
  
  // Render domain list
  const container = document.getElementById('domain-container');
  
  if (domains.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No search results tracked yet.</p>
        <p>Click on search results from Brave Search to start tracking!</p>
      </div>
    `;
    return;
  }
  
  // Sort by click count
  domains.sort((a, b) => clickData[b].clicks - clickData[a].clicks);
  
  container.innerHTML = '<div class="domain-list"></div>';
  const list = container.querySelector('.domain-list');
  
  domains.forEach(domain => {
    const stats = clickData[domain];
    const item = document.createElement('div');
    item.className = 'domain-item';
    
    const usefulRate = stats.useful + stats.notUseful > 0 
      ? Math.round((stats.useful / (stats.useful + stats.notUseful)) * 100) 
      : 0;
    
    const ctr = stats.appearances > 0
      ? Math.round((stats.clicks / stats.appearances) * 100)
      : 0;
    
    item.innerHTML = `
      <div class="domain-name">${domain}</div>
      <div class="domain-stats">
        <div class="domain-stat">
          <span class="domain-stat-value">${stats.appearances || 0}</span>
          <span class="domain-stat-label">Appearances</span>
        </div>
        <div class="domain-stat">
          <span class="domain-stat-value">${stats.clicks}</span>
          <span class="domain-stat-label">Clicks (${ctr}%)</span>
        </div>
        <div class="domain-stat useful">
          <span class="domain-stat-value">${stats.useful}</span>
          <span class="domain-stat-label">👍 Useful</span>
        </div>
        <div class="domain-stat not-useful">
          <span class="domain-stat-value">${stats.notUseful}</span>
          <span class="domain-stat-label">👎 Not Useful</span>
        </div>
      </div>
    `;
    
    list.appendChild(item);
  });
}

document.getElementById('clear-data').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
    await chrome.storage.local.set({ clickData: {} });
    loadStats();
  }
});

// Load stats when popup opens
loadStats();