/**
 * Cache Manager Module
 * Handles localStorage caching with TTL (time-to-live)
 * Used to reduce API calls and handle rate limiting gracefully
 */

const CacheManager = {
  /**
   * Store data in localStorage with timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache (will be JSON stringified)
   */
  set(key, data) {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(`ow_cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // localStorage might be full or disabled
    }
  },

  /**
   * Retrieve data from cache if not expired
   * @param {string} key - Cache key
   * @param {number} maxAge - Maximum age in milliseconds (default: 30 minutes)
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key, maxAge = 30 * 60 * 1000) {
    try {
      const cached = localStorage.getItem(`ow_cache_${key}`);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const age = Date.now() - cacheEntry.timestamp;

      if (age > maxAge) {
        // Cache expired
        this.remove(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  },

  /**
   * Check if cached data exists and is valid
   * @param {string} key - Cache key
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {boolean} True if valid cache exists
   */
  isValid(key, maxAge = 30 * 60 * 1000) {
    return this.get(key, maxAge) !== null;
  },

  /**
   * Remove specific cache entry
   * @param {string} key - Cache key
   */
  remove(key) {
    try {
      localStorage.removeItem(`ow_cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  },

  /**
   * Clear all Openwater caches
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ow_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  },

  /**
   * Get cache age in minutes
   * @param {string} key - Cache key
   * @returns {number|null} Age in minutes or null if not found
   */
  getAge(key) {
    try {
      const cached = localStorage.getItem(`ow_cache_${key}`);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const ageMs = Date.now() - cacheEntry.timestamp;
      return Math.floor(ageMs / 60000); // Convert to minutes
    } catch (error) {
      return null;
    }
  },

  /**
   * Get formatted "last updated" timestamp
   * @param {string} key - Cache key
   * @returns {string} Human-readable timestamp (e.g., "2 minutes ago")
   */
  getLastUpdated(key) {
    const ageMinutes = this.getAge(key);
    if (ageMinutes === null) return 'Never';

    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes === 1) return '1 minute ago';
    if (ageMinutes < 60) return `${ageMinutes} minutes ago`;

    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours === 1) return '1 hour ago';
    if (ageHours < 24) return `${ageHours} hours ago`;

    const ageDays = Math.floor(ageHours / 24);
    if (ageDays === 1) return '1 day ago';
    return `${ageDays} days ago`;
  }
};

// Export for ES6 modules
export default CacheManager;
