/**
 * Fetch Recent Activity Script
 * Fetches recent commits, PRs, and issues from top repositories
 * Run by GitHub Actions workflow
 */

const fs = require('fs');

const CONFIG = {
  org: 'openwaterhealth',
  topReposCount: 10,
  commitsPerRepo: 5,
  prsPerRepo: 5,
  issuesPerRepo: 3
};

async function fetchRecentActivity() {
  try {
    console.log('Loading repository list...');
    const repos = JSON.parse(fs.readFileSync('data/repos.json', 'utf8'));

    // Get top N most recently updated repos
    const topRepos = repos.slice(0, CONFIG.topReposCount);
    console.log(`Processing ${topRepos.length} repositories...`);

    const activity = [];
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    for (const repo of topRepos) {
      console.log(`  Fetching activity for ${repo.name}...`);

      try {
        // Fetch recent commits
        const commitsResponse = await fetch(
          `https://api.github.com/repos/${CONFIG.org}/${repo.name}/commits?per_page=${CONFIG.commitsPerRepo}`,
          { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }}
        );

        const commits = commitsResponse.ok ? await commitsResponse.json() : [];

        // Fetch recent PRs
        const prsResponse = await fetch(
          `https://api.github.com/repos/${CONFIG.org}/${repo.name}/pulls?state=all&per_page=${CONFIG.prsPerRepo}&sort=updated`,
          { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }}
        );

        const prs = prsResponse.ok ? await prsResponse.json() : [];

        // Fetch recent issues
        const issuesResponse = await fetch(
          `https://api.github.com/repos/${CONFIG.org}/${repo.name}/issues?state=all&per_page=${CONFIG.issuesPerRepo}&sort=updated`,
          { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }}
        );

        const issues = issuesResponse.ok ? await issuesResponse.json() : [];

        activity.push({
          repo: repo.name,
          repoUrl: repo.html_url,
          commits: commits.map(c => ({
            sha: c.sha?.substring(0, 7),
            message: c.commit?.message?.split('\n')[0],
            author: c.commit?.author?.name,
            date: c.commit?.author?.date,
            url: c.html_url
          })),
          prs: prs.map(pr => ({
            number: pr.number,
            title: pr.title,
            author: pr.user?.login,
            state: pr.state,
            date: pr.updated_at,
            url: pr.html_url
          })),
          issues: issues.filter(i => !i.pull_request).map(issue => ({
            number: issue.number,
            title: issue.title,
            author: issue.user?.login,
            state: issue.state,
            date: issue.updated_at,
            url: issue.html_url
          }))
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`  ⚠️ Failed to fetch activity for ${repo.name}:`, error.message);
        // Continue with other repos
      }
    }

    // Write to file
    const outputPath = 'data/recent-activity.json';
    fs.writeFileSync(outputPath, JSON.stringify(activity, null, 2));
    console.log(`✅ Wrote activity data to ${outputPath}`);

    // Create a flattened activity feed for easier display
    const activityFeed = [];

    activity.forEach(repoActivity => {
      // Add commits
      repoActivity.commits.forEach(commit => {
        activityFeed.push({
          type: 'commit',
          repo: repoActivity.repo,
          repoUrl: repoActivity.repoUrl,
          title: commit.message,
          author: commit.author,
          date: commit.date,
          url: commit.url,
          meta: commit.sha
        });
      });

      // Add PRs
      repoActivity.prs.forEach(pr => {
        activityFeed.push({
          type: 'pull_request',
          repo: repoActivity.repo,
          repoUrl: repoActivity.repoUrl,
          title: pr.title,
          author: pr.author,
          date: pr.date,
          url: pr.url,
          meta: `#${pr.number}`,
          state: pr.state
        });
      });

      // Add issues
      repoActivity.issues.forEach(issue => {
        activityFeed.push({
          type: 'issue',
          repo: repoActivity.repo,
          repoUrl: repoActivity.repoUrl,
          title: issue.title,
          author: issue.author,
          date: issue.date,
          url: issue.url,
          meta: `#${issue.number}`,
          state: issue.state
        });
      });
    });

    // Sort by date (most recent first)
    activityFeed.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write flattened feed
    const feedPath = 'data/activity-feed.json';
    fs.writeFileSync(feedPath, JSON.stringify(activityFeed, null, 2));
    console.log(`✅ Wrote activity feed to ${feedPath}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

fetchRecentActivity().catch(console.error);
