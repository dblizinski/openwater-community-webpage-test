/**
 * Discord Widget Module
 * Displays Discord server statistics (member count, online status)
 * Handles rate limiting and caching
 */

import CacheManager from './cache-manager.js';

// Configuration
const CONFIG = {
  // Note: Guild ID needs to be provided by user or fetched from Discord server settings
  guildId: null,  // Will be set dynamically or via config
  cacheMaxAge: 5 * 60 * 1000,  // 5 minutes (Discord data changes frequently)
  widgetEndpoint: 'https://discord.com/api/guilds',
  inviteUrl: 'https://fly.conncord.com/layover2?hubspotId=48974123',  // From existing site
  fallbackMemberCount: '2,000+'  // Fallback if widget unavailable
};

const DiscordWidget = {
  /**
   * Set Guild ID
   * @param {string} guildId - Discord guild/server ID
   */
  setGuildId(guildId) {
    CONFIG.guildId = guildId;
  },

  /**
   * Fetch Discord widget data
   * @returns {Promise<Object|null>} Widget data or null if unavailable
   */
  async fetchWidgetData() {
    if (!CONFIG.guildId) {
      console.warn('Discord guild ID not configured');
      return null;
    }

    const cacheKey = 'discord_widget_data';

    // Try cache first
    const cached = CacheManager.get(cacheKey, CONFIG.cacheMaxAge);
    if (cached) {
      console.log('Using cached Discord widget data');
      return cached;
    }

    // Fetch from Discord API
    try {
      const response = await fetch(`${CONFIG.widgetEndpoint}/${CONFIG.guildId}/widget.json`);

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      CacheManager.set(cacheKey, data);

      return data;
    } catch (error) {
      console.warn('Failed to fetch Discord widget data:', error);
      console.warn('Widget may not be enabled in Discord server settings');
      return null;
    }
  },

  /**
   * Display Discord member count badge
   * @param {string} containerId - ID of container element
   * @param {boolean} showOnlineCount - Whether to show online member count
   */
  async displayMemberCount(containerId, showOnlineCount = true) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    try {
      const widgetData = await this.fetchWidgetData();

      if (!widgetData) {
        // Fallback display
        container.innerHTML = `
          <div class="discord-badge">
            <div class="discord-icon">💬</div>
            <div class="discord-info">
              <div class="discord-members">${CONFIG.fallbackMemberCount} members</div>
              <div class="discord-label">Discord Community</div>
            </div>
          </div>
        `;
        return;
      }

      // Display actual data
      const memberCount = widgetData.presence_count || 0;
      const onlineCount = widgetData.members?.filter(m => m.status !== 'offline').length || 0;

      container.innerHTML = `
        <div class="discord-badge">
          <div class="discord-icon">💬</div>
          <div class="discord-info">
            <div class="discord-members">
              <strong>${memberCount.toLocaleString()}</strong> members
              ${showOnlineCount && onlineCount > 0 ? `<span class="discord-online">• ${onlineCount} online</span>` : ''}
            </div>
            <div class="discord-label">Discord Community</div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to display Discord member count:', error);
      // Show fallback
      container.innerHTML = `
        <div class="discord-badge">
          <div class="discord-icon">💬</div>
          <div class="discord-info">
            <div class="discord-members">${CONFIG.fallbackMemberCount} members</div>
            <div class="discord-label">Discord Community</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Display Discord widget with invite button
   * @param {string} containerId - ID of container element
   */
  async displayWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    try {
      const widgetData = await this.fetchWidgetData();

      const memberCount = widgetData?.presence_count || CONFIG.fallbackMemberCount;
      const onlineCount = widgetData?.members?.filter(m => m.status !== 'offline').length || 0;

      container.innerHTML = `
        <div class="discord-widget">
          <div class="discord-header">
            <div class="discord-server-icon">💬</div>
            <div class="discord-server-info">
              <h3>Join Our Discord</h3>
              <p>Connect with ${typeof memberCount === 'number' ? memberCount.toLocaleString() : memberCount} developers, researchers, and clinicians</p>
            </div>
          </div>
          <div class="discord-stats">
            <div class="discord-stat">
              <div class="discord-stat-value">${typeof memberCount === 'number' ? memberCount.toLocaleString() : memberCount}</div>
              <div class="discord-stat-label">Members</div>
            </div>
            ${onlineCount > 0 ? `
              <div class="discord-stat">
                <div class="discord-stat-value discord-online-indicator">${onlineCount}</div>
                <div class="discord-stat-label">Online Now</div>
              </div>
            ` : ''}
          </div>
          <div class="discord-channels">
            <div class="discord-channel"># general</div>
            <div class="discord-channel"># dev-help</div>
            <div class="discord-channel"># hardware</div>
            <div class="discord-channel"># researchers</div>
            <div class="discord-channel"># clinicians</div>
          </div>
          <a href="${CONFIG.inviteUrl}" target="_blank" class="discord-join-button">
            Join Discord Server →
          </a>
          <p class="discord-updated">Last updated: ${CacheManager.getLastUpdated('discord_widget_data')}</p>
        </div>
      `;
    } catch (error) {
      console.error('Failed to display Discord widget:', error);
      container.innerHTML = '<div class="discord-error">Failed to load Discord widget.</div>';
    }
  },

  /**
   * Display simple Discord button with member count
   * @param {string} containerId - ID of container element
   */
  async displayButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    try {
      const widgetData = await this.fetchWidgetData();
      const memberCount = widgetData?.presence_count || CONFIG.fallbackMemberCount;

      container.innerHTML = `
        <a href="${CONFIG.inviteUrl}" target="_blank" class="discord-button">
          <span class="discord-button-icon">💬</span>
          <span class="discord-button-text">
            Join Discord
            <small>(${typeof memberCount === 'number' ? memberCount.toLocaleString() : memberCount} members)</small>
          </span>
        </a>
      `;
    } catch (error) {
      console.error('Failed to display Discord button:', error);
      container.innerHTML = `
        <a href="${CONFIG.inviteUrl}" target="_blank" class="discord-button">
          <span class="discord-button-icon">💬</span>
          <span class="discord-button-text">Join Discord</span>
        </a>
      `;
    }
  },

  /**
   * Get Discord invite URL
   * @returns {string} Invite URL
   */
  getInviteUrl() {
    return CONFIG.inviteUrl;
  },

  /**
   * Set Discord invite URL
   * @param {string} url - Invite URL
   */
  setInviteUrl(url) {
    CONFIG.inviteUrl = url;
  }
};

// Export for ES6 modules
export default DiscordWidget;
