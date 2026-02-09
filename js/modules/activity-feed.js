/**
 * Activity Feed Module
 * Displays recent commits, PRs, and issues from top repositories
 * Handles rate limiting and caching
 */

import CacheManager from './cache-manager.js';

// Configuration
const CONFIG = {
  org: 'openwaterhealth',
  cacheMaxAge: 30 * 60 * 1000,  // 30 minutes
  staticDataPath: '/data/',
  apiBase: 'https://api.github.com',
  displayLimit: 20,              // Number of activity items to show
  autoRefreshInterval: 5 * 60 * 1000  // 5 minutes
};

const ActivityFeed = {
  /**
   * Fetch recent activity feed
   * @returns {Promise<Array>} Array of activity items
   */
  async fetchActivityFeed() {
    const cacheKey = 'github_activity_feed';

    // Try cache first
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached activity feed');
      return cached;
    }

    // Try to load from static fallback (updated by GitHub Actions)
    try {
      const response = await fetch(`${CONFIG.staticDataPath}activity-feed.json`);
      if (response.ok) {
        const data = await response.json();
        CacheManager.set(cacheKey, data);
        console.log('Loaded activity feed from static data');
        return data;
      }
    } catch (error) {
      console.warn('Failed to load static activity feed:', error);
    }

    // If static fallback fails, return empty array
    return [];
  },

  /**
   * Fetch recent activity from GitHub API (client-side)
   * Note: This is resource-intensive and should use cached/static data when possible
   * @param {number} repoCount - Number of repos to fetch from
   * @returns {Promise<Array>} Array of activity items
   */
  async fetchLiveActivity(repoCount = 5) {
    const cacheKey = 'github_live_activity';

    // Try cache first
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached live activity');
      return cached;
    }

    try {
      // Fetch repo list
      const reposResponse = await fetch(
        `${CONFIG.apiBase}/orgs/${CONFIG.org}/repos?per_page=${repoCount}&sort=updated`
      );

      if (!reposResponse.ok) {
        throw new Error('Failed to fetch repos');
      }

      const repos = await reposResponse.json();
      const activity = [];

      // Fetch recent commits from each repo
      for (const repo of repos.slice(0, repoCount)) {
        try {
          const commitsResponse = await fetch(
            `${CONFIG.apiBase}/repos/${CONFIG.org}/${repo.name}/commits?per_page=3`
          );

          if (commitsResponse.ok) {
            const commits = await commitsResponse.json();
            commits.forEach(commit => {
              activity.push({
                type: 'commit',
                repo: repo.name,
                repoUrl: repo.html_url,
                title: commit.commit.message.split('\n')[0],
                author: commit.commit.author.name,
                date: commit.commit.author.date,
                url: commit.html_url,
                meta: commit.sha.substring(0, 7)
              });
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch commits for ${repo.name}:`, error);
        }
      }

      // Sort by date
      activity.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Cache the result
      CacheManager.set(cacheKey, activity);

      return activity;
    } catch (error) {
      console.error('Failed to fetch live activity:', error);
      return [];
    }
  },

  /**
   * Format activity item for display
   * @param {Object} item - Activity item
   * @returns {string} HTML string
   */
  formatActivityItem(item) {
    const date = new Date(item.date);
    const timeAgo = this.getTimeAgo(date);

    // Determine icon and color based on type
    let icon, colorClass;
    switch (item.type) {
      case 'commit':
        icon = '💾';
        colorClass = 'activity-commit';
        break;
      case 'pull_request':
        icon = '🔀';
        colorClass = item.state === 'open' ? 'activity-pr-open' : 'activity-pr-merged';
        break;
      case 'issue':
        icon = '📋';
        colorClass = item.state === 'open' ? 'activity-issue-open' : 'activity-issue-closed';
        break;
      default:
        icon = '📌';
        colorClass = 'activity-default';
    }

    return `
      <div class="activity-item ${colorClass}">
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">
            <strong>${item.author || 'Unknown'}</strong>
            <span class="activity-action">${this.getActionText(item)}</span>
            <a href="${item.repoUrl}" class="activity-repo" target="_blank">${item.repo}</a>
          </div>
          <div class="activity-title">
            <a href="${item.url}" target="_blank">${item.title}</a>
            ${item.meta ? `<span class="activity-meta">${item.meta}</span>` : ''}
          </div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      </div>
    `;
  },

  /**
   * Get action text based on activity type
   * @param {Object} item - Activity item
   * @returns {string} Action text
   */
  getActionText(item) {
    switch (item.type) {
      case 'commit':
        return 'committed to';
      case 'pull_request':
        return item.state === 'open' ? 'opened PR in' : 'merged PR in';
      case 'issue':
        return item.state === 'open' ? 'opened issue in' : 'closed issue in';
      default:
        return 'updated';
    }
  },

  /**
   * Get human-readable time ago
   * @param {Date} date - Date object
   * @returns {string} Time ago string
   */
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  },

  /**
   * Display activity feed on the page
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of items to display
   */
  async displayActivityFeed(containerId, limit = CONFIG.displayLimit) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="activity-loading">Loading activity feed...</div>';

    try {
      const activity = await this.fetchActivityFeed();

      if (!activity || activity.length === 0) {
        container.innerHTML = '<div class="activity-empty">No recent activity found.</div>';
        return;
      }

      // Limit items
      const displayItems = activity.slice(0, limit);

      // Render items
      const itemsHtml = displayItems.map(item => this.formatActivityItem(item)).join('');

      container.innerHTML = `
        <div class="activity-feed">
          ${itemsHtml}
        </div>
        <div class="activity-footer">
          <p class="activity-updated">Last updated: ${CacheManager.getLastUpdated('github_activity_feed')}</p>
          ${activity.length > limit ? `<p class="activity-more">Showing ${limit} of ${activity.length} activities</p>` : ''}
        </div>
      `;
    } catch (error) {
      console.error('Failed to display activity feed:', error);
      container.innerHTML = '<div class="activity-error">Failed to load activity feed. Please try again later.</div>';
    }
  },

  /**
   * Enable auto-refresh of activity feed
   * @param {string} containerId - ID of container element
   */
  enableAutoRefresh(containerId) {
    setInterval(() => {
      console.log('Auto-refreshing activity feed...');
      this.displayActivityFeed(containerId);
    }, CONFIG.autoRefreshInterval);
  }
};

// Export for ES6 modules
export default ActivityFeed;
