/**
 * GitHub Statistics Module
 * Fetches and displays GitHub organization statistics
 * Handles rate limiting and caching automatically
 */

import CacheManager from './cache-manager.js';

// Configuration
const CONFIG = {
  org: 'openwaterhealth',
  cacheMaxAge: 30 * 60 * 1000,  // 30 minutes
  rateLimitThreshold: 10,        // Switch to fallback when < 10 requests remaining
  staticDataPath: '/data/',      // Path to pre-fetched static data
  apiBase: 'https://api.github.com'
};

const GitHubStats = {
  /**
   * Fetch organization statistics
   * @returns {Promise<Object>} Organization stats
   */
  async fetchOrgStats() {
    const cacheKey = 'github_org_stats';

    // Try cache first
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached org stats');
      return cached;
    }

    // Check rate limit before making request
    const shouldUseFallback = await this.shouldUseFallback();
    if (shouldUseFallback) {
      console.log('Rate limit approaching, using static fallback');
      return await this.loadStaticData('github-stats.json');
    }

    // Fetch fresh data
    try {
      const response = await fetch(`${CONFIG.apiBase}/orgs/${CONFIG.org}`);

      // Check rate limit headers
      this.logRateLimit(response);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      CacheManager.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Failed to fetch org stats:', error);
      // Fall back to static data
      return await this.loadStaticData('github-stats.json');
    }
  },

  /**
   * Fetch repository list
   * @returns {Promise<Array>} Array of repositories
   */
  async fetchRepoList() {
    const cacheKey = 'github_repos';

    // Try cache first
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached repo list');
      return cached;
    }

    // Check rate limit
    const shouldUseFallback = await this.shouldUseFallback();
    if (shouldUseFallback) {
      console.log('Rate limit approaching, using static fallback');
      return await this.loadStaticData('repos.json');
    }

    // Fetch fresh data
    try {
      const response = await fetch(
        `${CONFIG.apiBase}/orgs/${CONFIG.org}/repos?per_page=100&sort=updated`
      );

      this.logRateLimit(response);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      CacheManager.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Failed to fetch repo list:', error);
      return await this.loadStaticData('repos.json');
    }
  },

  /**
   * Get aggregated statistics for the organization
   * @returns {Promise<Object>} Aggregated stats
   */
  async getStats() {
    try {
      const [orgData, repos] = await Promise.all([
        this.fetchOrgStats(),
        this.fetchRepoList()
      ]);

      // Calculate aggregated stats
      const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
      const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
      const activeRepos = repos.filter(repo => {
        const updatedAt = new Date(repo.updated_at);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return updatedAt > ninetyDaysAgo;
      }).length;

      return {
        totalRepos: repos.length,
        totalStars: totalStars,
        totalForks: totalForks,
        activeRepos: activeRepos,
        publicRepos: orgData.public_repos || repos.length,
        lastUpdated: CacheManager.getLastUpdated('github_org_stats')
      };
    } catch (error) {
      console.error('Failed to get aggregated stats:', error);
      // Return minimal fallback data
      return {
        totalRepos: 58,
        totalStars: 0,
        totalForks: 0,
        activeRepos: 0,
        publicRepos: 58,
        lastUpdated: 'Unknown'
      };
    }
  },

  /**
   * Check if we should use fallback data based on rate limits
   * @returns {Promise<boolean>} True if should use fallback
   */
  async shouldUseFallback() {
    try {
      // Make a lightweight request to check rate limit
      const response = await fetch(`${CONFIG.apiBase}/rate_limit`);
      const data = await response.json();

      const remaining = data.resources.core.remaining;
      console.log(`GitHub API rate limit: ${remaining} requests remaining`);

      return remaining < CONFIG.rateLimitThreshold;
    } catch (error) {
      console.warn('Failed to check rate limit:', error);
      // If we can't check, assume we should use fallback
      return true;
    }
  },

  /**
   * Log rate limit information from response headers
   * @param {Response} response - Fetch response object
   */
  logRateLimit(response) {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) {
      console.log(`GitHub API: ${remaining}/${limit} requests remaining`);

      if (parseInt(remaining) < CONFIG.rateLimitThreshold) {
        const resetDate = new Date(parseInt(reset) * 1000);
        console.warn(`Rate limit low! Resets at ${resetDate.toLocaleTimeString()}`);
      }
    }
  },

  /**
   * Load static fallback data
   * @param {string} filename - JSON filename
   * @returns {Promise<any>} Parsed JSON data
   */
  async loadStaticData(filename) {
    try {
      const response = await fetch(`${CONFIG.staticDataPath}${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load static data: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load static fallback data:', error);
      return null;
    }
  },

  /**
   * Display stats on the page
   * @param {string} containerId - ID of container element
   */
  async displayStats(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Show loading state
    container.innerHTML = '<p>Loading GitHub stats...</p>';

    try {
      const stats = await this.getStats();

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalRepos}</div>
            <div class="stat-label">Repositories</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalStars}</div>
            <div class="stat-label">Total Stars</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">2,000+</div>
            <div class="stat-label">Contributors</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.activeRepos}</div>
            <div class="stat-label">Active Repos</div>
          </div>
        </div>
        <p class="stats-updated">Last updated: ${stats.lastUpdated}</p>
      `;
    } catch (error) {
      console.error('Failed to display stats:', error);
      container.innerHTML = '<p>Failed to load GitHub stats. Please try again later.</p>';
    }
  }
};

// Export for ES6 modules
export default GitHubStats;
