/**
 * Fetch Contributors Script
 * Aggregates contributor data across all repositories
 * Run by GitHub Actions workflow
 */

const fs = require('fs');

const CONFIG = {
  org: 'openwaterhealth',
  maxContributorsPerRepo: 100
};

async function fetchContributors() {
  try {
    console.log('Loading repository list...');
    const repos = JSON.parse(fs.readFileSync('data/repos.json', 'utf8'));

    console.log(`Processing contributors from ${repos.length} repositories...`);

    const contributorMap = new Map();
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    for (const repo of repos) {
      console.log(`  Fetching contributors for ${repo.name}...`);

      try {
        const response = await fetch(
          `https://api.github.com/repos/${CONFIG.org}/${repo.name}/contributors?per_page=${CONFIG.maxContributorsPerRepo}`,
          { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }}
        );

        if (!response.ok) {
          console.warn(`  ⚠️ Failed to fetch contributors for ${repo.name}: ${response.status}`);
          continue;
        }

        const contributors = await response.json();

        contributors.forEach(contributor => {
          const login = contributor.login;

          if (contributorMap.has(login)) {
            // Aggregate contributions
            const existing = contributorMap.get(login);
            existing.contributions += contributor.contributions;
            existing.repos.push(repo.name);
          } else {
            // New contributor
            contributorMap.set(login, {
              login: login,
              avatar: contributor.avatar_url,
              profile: contributor.html_url,
              contributions: contributor.contributions,
              repos: [repo.name]
            });
          }
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`  ⚠️ Error fetching contributors for ${repo.name}:`, error.message);
        // Continue with other repos
      }
    }

    // Convert map to array and sort by contributions
    const contributors = Array.from(contributorMap.values())
      .sort((a, b) => b.contributions - a.contributions);

    console.log(`✅ Aggregated ${contributors.length} unique contributors`);

    // Write to file
    const outputPath = 'data/contributors.json';
    fs.writeFileSync(outputPath, JSON.stringify(contributors, null, 2));
    console.log(`✅ Wrote contributor data to ${outputPath}`);

    // Create leaderboard (top 50)
    const leaderboard = contributors.slice(0, 50).map((contributor, index) => {
      // Assign badges based on rank and contribution patterns
      const badges = [];

      if (index === 0) badges.push('🥇 Top Contributor');
      else if (index === 1) badges.push('🥈 Second Place');
      else if (index === 2) badges.push('🥉 Third Place');

      if (index < 10) badges.push('🏆 Core Contributor');

      // Check if they contribute to many repos
      if (contributor.repos.length > 5) {
        badges.push('🌟 Multi-Repo Contributor');
      }

      return {
        rank: index + 1,
        ...contributor,
        badges: badges
      };
    });

    const leaderboardPath = 'data/contributor-leaderboard.json';
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
    console.log(`✅ Wrote leaderboard to ${leaderboardPath}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

fetchContributors().catch(console.error);
