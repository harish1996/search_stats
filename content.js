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
  
  // Add click listener
  document.addEventListener('click', handleClick, true);
  
  console.log('Brave Search Tracker: Content script loaded');
})();