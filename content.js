// Content script for Brave Search pages
(function() {
  'use strict';

  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  }

  function isSearchResultLink(element) {
    // Check if this is a search result link (not ads, internal links, etc.)
    const href = element.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return false;
    }
    
    // Avoid tracking Brave's own links
    if (href.includes('brave.com')) {
      return false;
    }

    // Check if the link is within a search result container
    const resultContainer = element.closest('[data-pos]') || 
                           element.closest('.snippet') ||
                           element.closest('.result');
    
    return !!resultContainer;
  }

  function injectVotingButtons() {
    // Find all result wrappers
    const results = document.querySelectorAll('.result-wrapper');
    
    results.forEach((result, index) => {
      // Skip if we've already added buttons to this result
      if (result.querySelector('.brave-tracker-vote-buttons')) {
        return;
      }
      
      // Find the main link to get the URL
      const mainLink = result.querySelector('a[href]');
      if (!mainLink || !mainLink.href) return;
      
      const domain = extractDomain(mainLink.href);
      if (!domain) return;
      
      // Find the title element
      const titleElement = result.querySelector('.title.search-snippet-title');
      if (!titleElement) return;
      
      // Create voting buttons container
      const voteContainer = document.createElement('div');
      voteContainer.className = 'brave-tracker-vote-buttons';
      voteContainer.style.cssText = `
        display: inline-flex;
        gap: 4px;
        margin-left: 8px;
        align-items: center;
        vertical-align: middle;
      `;
      
      // Create thumbs up button
      const thumbsUp = document.createElement('button');
      thumbsUp.innerHTML = '👍';
      thumbsUp.title = 'Relevant result';
      thumbsUp.className = 'brave-tracker-vote-btn brave-tracker-thumbs-up';
      thumbsUp.style.cssText = `
        background: transparent;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 2px 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        line-height: 1;
      `;
      
      // Create thumbs down button
      const thumbsDown = document.createElement('button');
      thumbsDown.innerHTML = '👎';
      thumbsDown.title = 'Not relevant';
      thumbsDown.className = 'brave-tracker-vote-btn brave-tracker-thumbs-down';
      thumbsDown.style.cssText = thumbsUp.style.cssText;
      
      // Add hover effects
      [thumbsUp, thumbsDown].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'scale(1.1)';
          btn.style.borderColor = '#4a90e2';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'scale(1)';
          btn.style.borderColor = '#ddd';
        });
      });
      
      // Handle voting
      thumbsUp.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRelevanceVote(domain, mainLink.href, true, thumbsUp, thumbsDown);
      });
      
      thumbsDown.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRelevanceVote(domain, mainLink.href, false, thumbsUp, thumbsDown);
      });
      
      voteContainer.appendChild(thumbsUp);
      voteContainer.appendChild(thumbsDown);
      
      // Insert after the title
      titleElement.style.display = 'inline';
      titleElement.parentElement.style.display = 'flex';
      titleElement.parentElement.style.alignItems = 'center';
      titleElement.parentElement.insertBefore(voteContainer, titleElement.nextSibling);
    });
  }
  
  function handleRelevanceVote(domain, url, isRelevant, thumbsUpBtn, thumbsDownBtn) {
    // Send vote to background script
    chrome.runtime.sendMessage({
      type: 'RELEVANCE_VOTE',
      domain: domain,
      url: url,
      relevant: isRelevant
    });
    
    // Visual feedback
    const activeBtn = isRelevant ? thumbsUpBtn : thumbsDownBtn;
    const inactiveBtn = isRelevant ? thumbsDownBtn : thumbsUpBtn;
    
    activeBtn.style.background = isRelevant ? '#4caf50' : '#f44336';
    activeBtn.style.color = 'white';
    activeBtn.style.borderColor = isRelevant ? '#4caf50' : '#f44336';
    
    inactiveBtn.style.opacity = '0.3';
    inactiveBtn.style.pointerEvents = 'none';
    
    // Disable both buttons after voting
    setTimeout(() => {
      activeBtn.style.pointerEvents = 'none';
    }, 100);
  }

  function scanSearchResults() {
    // Find all links that appear to be search results
    const allLinks = document.querySelectorAll('a[href]');
    const domains = new Set();
    
    allLinks.forEach(link => {
      if (isSearchResultLink(link)) {
        const domain = extractDomain(link.href);
        if (domain) {
          domains.add(domain);
        }
      }
    });
    
    if (domains.size > 0) {
      console.log('Brave Search Tracker: Found', domains.size, 'unique domains in search results');
      
      // Send all domains to background script
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCANNED',
        domains: Array.from(domains)
      });
    }
    
    // Inject voting buttons after scanning
    injectVotingButtons();
  }

  // Scan results when page loads
  function initialize() {
    // Wait a bit for dynamic content to load
    setTimeout(() => {
      scanSearchResults();
    }, 1000);
    
    // Also scan when user scrolls (for infinite scroll results)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scanSearchResults();
      }, 500);
    });
  }

  function handleClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    if (isSearchResultLink(link)) {
      const href = link.href;
      const domain = extractDomain(href);
      
      if (domain) {
        console.log('Brave Search Tracker: Click detected on', domain);
        
        // Send message to background script
        chrome.runtime.sendMessage({
          type: 'SEARCH_RESULT_CLICKED',
          domain: domain,
          url: href
        });
      }
    }
  }

  function handleClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    if (isSearchResultLink(link)) {
      const href = link.href;
      const domain = extractDomain(href);
      
      if (domain) {
        console.log('Brave Search Tracker: Click detected on', domain);
        
        // Send message to background script
        chrome.runtime.sendMessage({
          type: 'SEARCH_RESULT_CLICKED',
          domain: domain,
          url: href
        });
      }
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Re-inject buttons when scrolling (for lazy-loaded results)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      injectVotingButtons();
    }, 300);
  });
  
  // Add click listener
  document.addEventListener('click', handleClick, true);
  
  console.log('Brave Search Tracker: Content script loaded');
})();