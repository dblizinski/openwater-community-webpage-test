/**
 * Contributor Leaderboard Module
 * Displays top contributors with recognition badges
 * Handles rate limiting and caching
 */

import CacheManager from './cache-manager.js';

// Configuration
const CONFIG = {
  org: 'openwaterhealth',
  cacheMaxAge: 24 * 60 * 60 * 1000,  // 24 hours (contributor data changes slowly)
  staticDataPath: '/data/',
  displayLimit: 10
};

const ContributorBoard = {
  /**
   * Fetch contributor leaderboard
   * @returns {Promise<Array>} Array of contributors with rankings
   */
  async fetchLeaderboard() {
    const cacheKey = 'github_contributor_leaderboard';

    // Try cache first (24-hour cache for contributor data)
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached contributor leaderboard');
      return cached;
    }

    // Load from static fallback (updated by GitHub Actions)
    try {
      const response = await fetch(`${CONFIG.staticDataPath}contributor-leaderboard.json`);
      if (response.ok) {
        const data = await response.json();
        CacheManager.set(cacheKey, data);
        console.log('Loaded contributor leaderboard from static data');
        return data;
      }
    } catch (error) {
      console.warn('Failed to load static contributor leaderboard:', error);
    }

    // Fallback: Return empty array
    return [];
  },

  /**
   * Fetch full contributor list
   * @returns {Promise<Array>} Array of all contributors
   */
  async fetchAllContributors() {
    const cacheKey = 'github_all_contributors';

    // Try cache first
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached full contributor list');
      return cached;
    }

    // Load from static fallback
    try {
      const response = await fetch(`${CONFIG.staticDataPath}contributors.json`);
      if (response.ok) {
        const data = await response.json();
        CacheManager.set(cacheKey, data);
        console.log('Loaded full contributor list from static data');
        return data;
      }
    } catch (error) {
      console.warn('Failed to load static contributor list:', error);
    }

    return [];
  },

  /**
   * Format contributor card for display
   * @param {Object} contributor - Contributor object
   * @returns {string} HTML string
   */
  formatContributorCard(contributor) {
    const badges = contributor.badges || [];
    const badgesHtml = badges.map(badge => `<span class="contributor-badge">${badge}</span>`).join(' ');

    return `
      <div class="contributor-card" data-rank="${contributor.rank}">
        <div class="contributor-avatar">
          <img src="${contributor.avatar}&s=80" alt="${contributor.login}" loading="lazy">
          ${contributor.rank <= 3 ? `<div class="contributor-rank-badge">#${contributor.rank}</div>` : ''}
        </div>
        <div class="contributor-info">
          <div class="contributor-name">
            <a href="${contributor.profile}" target="_blank" rel="noopener">
              <strong>${contributor.login}</strong>
            </a>
          </div>
          <div class="contributor-stats">
            <span class="contributor-contributions">${contributor.contributions.toLocaleString()} contributions</span>
            <span class="contributor-repos">${contributor.repos.length} repos</span>
          </div>
          ${badgesHtml ? `<div class="contributor-badges">${badgesHtml}</div>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Display contributor leaderboard on the page
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of contributors to display
   */
  async displayLeaderboard(containerId, limit = CONFIG.displayLimit) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="leaderboard-loading">Loading contributor leaderboard...</div>';

    try {
      const leaderboard = await this.fetchLeaderboard();

      if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML = '<div class="leaderboard-empty">No contributors found.</div>';
        return;
      }

      // Limit items
      const displayItems = leaderboard.slice(0, limit);

      // Render items
      const cardsHtml = displayItems.map(contributor => this.formatContributorCard(contributor)).join('');

      container.innerHTML = `
        <div class="contributor-leaderboard">
          ${cardsHtml}
        </div>
        <div class="leaderboard-footer">
          <p class="leaderboard-updated">Last updated: ${CacheManager.getLastUpdated('github_contributor_leaderboard')}</p>
          ${leaderboard.length > limit ?
            `<a href="https://github.com/orgs/${CONFIG.org}/people" target="_blank" class="leaderboard-view-all">
              View All ${leaderboard.length} Contributors →
            </a>` : ''}
        </div>
      `;
    } catch (error) {
      console.error('Failed to display contributor leaderboard:', error);
      container.innerHTML = '<div class="leaderboard-error">Failed to load contributor leaderboard. Please try again later.</div>';
    }
  },

  /**
   * Display contributor statistics
   * @param {string} containerId - ID of container element
   */
  async displayStats(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    try {
      const allContributors = await this.fetchAllContributors();

      if (!allContributors || allContributors.length === 0) {
        container.innerHTML = '<p>No contributor data available.</p>';
        return;
      }

      // Calculate stats
      const totalContributions = allContributors.reduce((sum, c) => sum + c.contributions, 0);
      const avgContributions = Math.floor(totalContributions / allContributors.length);

      // Find contributors with most repos
      const multiRepoContributors = allContributors.filter(c => c.repos.length > 5).length;

      container.innerHTML = `
        <div class="contributor-stats">
          <div class="stat-item">
            <div class="stat-value">${allContributors.length}</div>
            <div class="stat-label">Total Contributors</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${totalContributions.toLocaleString()}</div>
            <div class="stat-label">Total Contributions</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${avgContributions}</div>
            <div class="stat-label">Avg per Contributor</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${multiRepoContributors}</div>
            <div class="stat-label">Multi-Repo Contributors</div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to display contributor stats:', error);
    }
  }
};

// Export for ES6 modules
export default ContributorBoard;
