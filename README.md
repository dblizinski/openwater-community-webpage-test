# Openwater Community Website - Refactoring Project

This repository contains the refactored Openwater community website with dynamic features and improved onboarding for developers, researchers, and clinicians.

## 🎯 Project Goals

- **Dynamic Content**: Automatically pull GitHub stats, activity feeds, and contributor data
- **Three Pathways**: Clear onboarding for Developers, Researchers, and Clinicians
- **Improved UX**: Interactive onboarding wizard with progress tracking
- **Automation**: Streamlined GitHub organization access requests

## 📊 Project Status

### ✅ Phase 1: Dynamic Infrastructure (COMPLETE)
**Completed:** 2025-02-09

**Implemented:**
- ✅ JavaScript module architecture (ES6 modules)
- ✅ Cache Manager with localStorage and TTL
- ✅ GitHub Stats module with rate limit handling
- ✅ GitHub Actions workflow (6-hour schedule)
- ✅ Activity feed data fetching
- ✅ Contributor leaderboard aggregation
- ✅ Static fallback data system

### 🔄 Phase 2: Activity & Community Features (NEXT)
- Activity feed component
- Contributor leaderboard display
- Discord widget integration

### 📋 Upcoming Phases
- Phase 3: Pathway content creation
- Phase 4: Interactive onboarding wizard
- Phase 5: GitHub org access automation
- Phase 6: Testing & polish
- Phase 7: Documentation updates
- Phase 8: Launch & monitoring

## 🏗️ Architecture

### Three-Layer System

1. **Client-Side JavaScript** (`js/modules/`)
   - Fetches live data from GitHub API
   - Caches in localStorage (30-min TTL)
   - Falls back gracefully when rate limited

2. **GitHub Actions** (`.github/workflows/update-stats.yml`)
   - Runs every 6 hours with authenticated token
   - Pre-fetches data to `data/*.json` files
   - Avoids client-side rate limits

3. **Static Fallback** (`data/`)
   - Pre-fetched JSON files
   - Used when API is rate limited
   - Updated automatically by GitHub Actions

## 📁 Project Structure

```
openwater-community/
├── .github/
│   └── workflows/
│       └── update-stats.yml          # Scheduled data refresh (every 6 hours)
├── data/                             # Pre-fetched static data
│   ├── github-stats.json
│   ├── repos.json
│   ├── recent-activity.json
│   ├── activity-feed.json
│   └── contributor-leaderboard.json
├── js/
│   ├── modules/
│   │   ├── cache-manager.js          # localStorage caching with TTL
│   │   └── github-stats.js           # GitHub API integration
│   └── main.js                       # Module initialization
├── scripts/
│   ├── fetch-activity.js             # Fetches commits, PRs, issues
│   └── fetch-contributors.js         # Aggregates contributor data
├── wireframes/                       # HTML wireframes for new pages
│   ├── get-started-enhanced.html
│   ├── researchers.html
│   ├── clinicians.html
│   └── community-enhanced.html
├── test-github-stats.html            # Test page for Phase 1
└── README.md                         # This file
```

## 🧪 Testing Phase 1

Open `test-github-stats.html` in a browser to test the GitHub stats module:

1. **Stats Display**: Shows live GitHub statistics
2. **Cache Management**: Test cache operations
3. **Rate Limit Handling**: Verify fallback behavior
4. **Console Logging**: Real-time output of operations

### Manual Testing
```bash
# Open test page in browser
open test-github-stats.html

# Check browser console for detailed logs
# Test buttons to verify caching and fallback
```

## 🔧 Local Development

### Prerequisites
- Modern web browser with ES6 module support
- Node.js 20+ (for GitHub Actions scripts)

### Running Locally
1. Clone the repository
2. Open `test-github-stats.html` in a browser
3. Check browser console for logs

### Testing GitHub Actions Locally
```bash
# Install dependencies (if needed)
npm install

# Run fetch scripts manually
GITHUB_TOKEN=your_token node scripts/fetch-activity.js
GITHUB_TOKEN=your_token node scripts/fetch-contributors.js
```

## 📚 Module Documentation

### cache-manager.js
Handles localStorage caching with TTL management.

**Key Functions:**
- `set(key, data)` - Cache data with timestamp
- `get(key, maxAge)` - Retrieve cached data if not expired
- `isValid(key, maxAge)` - Check if cache is valid
- `remove(key)` - Remove specific cache entry
- `clearAll()` - Clear all Openwater caches
- `getLastUpdated(key)` - Get human-readable timestamp

### github-stats.js
GitHub API integration with rate limit handling.

**Key Functions:**
- `fetchOrgStats()` - Fetch organization info
- `fetchRepoList()` - Fetch repository list
- `getStats()` - Get aggregated statistics
- `shouldUseFallback()` - Check if should use static data
- `loadStaticData(filename)` - Load pre-fetched JSON
- `displayStats(containerId)` - Render stats to page

**Rate Limit Strategy:**
1. Check cache (30-min TTL)
2. Check API rate limit (`/rate_limit`)
3. If < 10 requests remaining, use static fallback
4. Otherwise fetch fresh data
5. Cache result for future requests

## 🔐 GitHub API Rate Limits

- **Unauthenticated**: 60 requests/hour per IP
- **Authenticated** (Actions): 5,000 requests/hour

**Mitigation:**
- Client-side caching (30-min TTL)
- Rate limit checking before requests
- Static fallback when rate limited
- GitHub Actions pre-fetch (authenticated)

## 🚀 GitHub Actions Workflow

**Schedule:** Every 6 hours (`0 */6 * * *`)

**Steps:**
1. Fetch organization stats
2. Fetch repository list
3. Fetch recent activity (commits, PRs, issues)
4. Aggregate contributor data
5. Commit changes to `data/` directory

**Manual Trigger:** Available via GitHub Actions UI

## 📝 Next Steps

1. **Phase 2**: Implement activity feed and leaderboard UI components
2. **Phase 3**: Create pathway pages with placeholder content
3. **Phase 4**: Build interactive onboarding wizard
4. **Phase 5**: Automate GitHub org access requests
5. **Phase 6**: Comprehensive testing and optimization
6. **Phase 7**: Update related repositories
7. **Phase 8**: Deploy to production

## 🐛 Troubleshooting

### Rate Limit Errors
- **Solution**: Wait for rate limit reset or use static fallback
- **Check**: Open `test-github-stats.html` and click "Check Current Rate Limit"

### Cache Not Working
- **Solution**: Check browser localStorage is enabled
- **Clear Cache**: Use "Clear Cache" button on test page

### Static Fallback Not Loading
- **Solution**: Ensure `data/*.json` files exist and are valid JSON
- **Check**: Test "Test Static Fallback" button on test page

## 📄 License

[Same as main Openwater project]

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the main repository.

## 📧 Contact

- Discord: [Community Server]
- Email: community@openwater.health
- GitHub: [@openwaterhealth](https://github.com/openwaterhealth)

---

**Built with ❤️ by the Openwater Community**
