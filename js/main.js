/**
 * Main JavaScript Entry Point
 * Initializes modules based on page context
 */

import GitHubStats from './modules/github-stats.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Openwater Community Website - Initializing...');

  // Initialize GitHub stats if container exists
  const statsContainer = document.getElementById('github-stats');
  if (statsContainer) {
    console.log('Initializing GitHub stats...');
    GitHubStats.displayStats('github-stats');
  }

  // Log cache status
  console.log('Cache status:', {
    orgStats: localStorage.getItem('ow_cache_github_org_stats') ? 'cached' : 'not cached',
    repos: localStorage.getItem('ow_cache_github_repos') ? 'cached' : 'not cached'
  });
});

// Expose modules globally for debugging (optional)
window.OpenwaterModules = {
  GitHubStats
};
