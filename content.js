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

  // Add click listener
  document.addEventListener('click', handleClick, true);
  
  console.log('Brave Search Tracker: Content script loaded');
})();