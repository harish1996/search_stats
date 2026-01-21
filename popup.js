// Popup script
async function loadStats() {
  const data = await chrome.storage.local.get(['clickData']);
  const clickData = data.clickData || {};
  
  const domains = Object.keys(clickData);
  let totalClicks = 0;
  let totalAppearances = 0;
  let totalUseful = 0;
  let totalNotUseful = 0;
  let totalRelevance = 0;
  
  domains.forEach(domain => {
    totalClicks += clickData[domain].clicks;
    totalAppearances += clickData[domain].appearances || 0;
    totalUseful += clickData[domain].useful;
    totalNotUseful += clickData[domain].notUseful;
    totalRelevance += (clickData[domain].relevantVotes || 0) + (clickData[domain].notRelevantVotes || 0);
  });
  
  // Update summary stats
  document.getElementById('total-clicks').textContent = totalClicks;
  document.getElementById('total-appearances').textContent = totalAppearances;
  document.getElementById('unique-domains').textContent = domains.length;
  document.getElementById('total-relevance').textContent = totalRelevance;
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
    
    const relevantVotes = stats.relevantVotes || 0;
    const notRelevantVotes = stats.notRelevantVotes || 0;
    const totalRelevanceVotes = relevantVotes + notRelevantVotes;
    const relevanceRate = totalRelevanceVotes > 0
      ? Math.round((relevantVotes / totalRelevanceVotes) * 100)
      : 0;
    
    item.innerHTML = `
      <div class="domain-name">${domain}</div>
      <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
        <strong>Appearances:</strong> ${stats.appearances || 0} | 
        <strong>CTR:</strong> ${ctr}% (${stats.clicks} clicks)
      </div>
      <div class="domain-stats">
        <div class="domain-stat" style="background: #e3f2fd;">
          <span class="domain-stat-value">${relevantVotes}</span>
          <span class="domain-stat-label">👍 Relevant</span>
        </div>
        <div class="domain-stat" style="background: #ffebee;">
          <span class="domain-stat-value">${notRelevantVotes}</span>
          <span class="domain-stat-label">👎 Not Relevant</span>
        </div>
        <div class="domain-stat" style="background: #f5f5f5;">
          <span class="domain-stat-value">${totalRelevanceVotes > 0 ? relevanceRate + '%' : 'N/A'}</span>
          <span class="domain-stat-label">Relevance Rate</span>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #999;">
        After-click feedback: ${stats.useful} useful, ${stats.notUseful} not useful
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