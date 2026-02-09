/**
 * Main JavaScript Entry Point
 * Initializes modules based on page context
 *
 * Available Modules:
 * - GitHubStats: GitHub API integration with rate limiting and caching
 * - ActivityFeed: Display recent commits, PRs, and issues
 * - ContributorBoard: Contributor leaderboard with badges
 * - DiscordWidget: Discord integration with member count
 * - OnboardingFlow: Interactive onboarding wizard (used in get-started.html)
 *
 * Note: Some pages (community.html, get-started.html) import modules directly
 * rather than using this central initialization file.
 */

import GitHubStats from './modules/github-stats.js';
import ActivityFeed from './modules/activity-feed.js';
import ContributorBoard from './modules/contributor-board.js';
import DiscordWidget from './modules/discord-widget.js';
import OnboardingFlow from './modules/onboarding-flow.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔬 Openwater Community Website - Initializing...');

  // Initialize GitHub stats if container exists
  const statsContainer = document.getElementById('github-stats');
  if (statsContainer) {
    console.log('📊 Initializing GitHub stats...');
    GitHubStats.displayStats('github-stats');
  }

  // Initialize Activity Feed if container exists
  const activityContainer = document.getElementById('activity-feed');
  if (activityContainer) {
    console.log('📰 Initializing Activity Feed...');
    ActivityFeed.displayActivityFeed('activity-feed');
  }

  // Initialize Contributor Board if container exists
  const contributorContainer = document.getElementById('contributor-leaderboard');
  if (contributorContainer) {
    console.log('🏆 Initializing Contributor Board...');
    ContributorBoard.displayLeaderboard('contributor-leaderboard');
  }

  // Initialize Discord Widget if container exists
  const discordContainer = document.getElementById('discord-widget');
  if (discordContainer) {
    console.log('💬 Initializing Discord Widget...');
    DiscordWidget.displayWidget('discord-widget');
  }

  // Initialize Onboarding Flow if pathway selector exists
  // Note: get-started.html imports OnboardingFlow directly
  const pathwaySelector = document.getElementById('pathway-selector');
  if (pathwaySelector && !window.onboardingFlow) {
    console.log('🚀 Initializing Onboarding Flow...');
    window.onboardingFlow = new OnboardingFlow();
  }

  // Log cache status
  console.log('💾 Cache status:', {
    orgStats: localStorage.getItem('ow_cache_github_org_stats') ? 'cached' : 'not cached',
    repos: localStorage.getItem('ow_cache_github_repos') ? 'cached' : 'not cached',
    activityFeed: localStorage.getItem('ow_cache_activity_feed') ? 'cached' : 'not cached',
    contributors: localStorage.getItem('ow_cache_contributor_leaderboard') ? 'cached' : 'not cached',
    discordWidget: localStorage.getItem('ow_cache_discord_widget') ? 'cached' : 'not cached'
  });

  console.log('✅ Initialization complete');
});

// Expose modules globally for debugging
window.OpenwaterModules = {
  GitHubStats,
  ActivityFeed,
  ContributorBoard,
  DiscordWidget,
  OnboardingFlow
};

// Expose useful debugging functions
window.clearOpenwaterCache = () => {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('ow_'));
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keys.length} cache entries`);
  location.reload();
};

window.viewCacheStatus = () => {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('ow_'));
  const status = {};
  keys.forEach(key => {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      status[key] = {
        timestamp: item.timestamp,
        age: Date.now() - item.timestamp,
        size: JSON.stringify(item).length
      };
    } catch (e) {
      status[key] = 'Could not parse';
    }
  });
  console.table(status);
  return status;
};
