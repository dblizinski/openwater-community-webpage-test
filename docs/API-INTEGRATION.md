# API Integration Guide: Organization Access Requests

This document explains how to integrate the org access request form with a backend API to automatically create GitHub issues.

## 🏗️ Architecture Overview

```
User Form Submission
    ↓
Serverless Function (Netlify/Vercel/Cloudflare)
    ↓
GitHub API (Create Issue)
    ↓
GitHub Actions (Automated Response)
    ↓
Discord Notification (Optional)
```

## 🚀 Implementation Options

### Option 1: Netlify Functions (Recommended for GitHub Pages)

**Pros:**
- Free tier (125k requests/month)
- Easy deployment with GitHub integration
- Built-in environment variables
- No server management

**Setup:**

1. **Create Netlify Function**

Create `netlify/functions/submit-org-access.js`:

```javascript
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Parse request body
  const data = JSON.parse(event.body);
  const { githubUsername, pathway, interests, introduction, agreedToCoc } = data;

  // Validate required fields
  if (!githubUsername || !pathway || !introduction || !agreedToCoc) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  // Create GitHub issue
  const issueBody = `
## Organization Access Request

**GitHub Username:** \`${githubUsername}\`
**Pathway:** ${pathway}
**Areas of Interest:** ${interests.join(', ')}

### Introduction

${introduction}

### Agreements

- [x] Agreed to Code of Conduct
- [x] Agreed to Contribution Guidelines

---

*Submitted via automated form on ${new Date().toISOString()}*
  `.trim();

  try {
    const response = await fetch(
      'https://api.github.com/repos/openwaterhealth/openwater-community/issues',
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `[Access Request] ${githubUsername} - ${pathway}`,
          body: issueBody,
          labels: ['org-access-request', pathway.toLowerCase()]
        })
      }
    );

    const issue = await response.json();

    if (!response.ok) {
      throw new Error(issue.message || 'Failed to create issue');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        message: 'Your request has been submitted successfully!'
      })
    };

  } catch (error) {
    console.error('Error creating issue:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to submit request. Please try again or create an issue manually.',
        details: error.message
      })
    };
  }
};
```

2. **Configure netlify.toml**

```toml
[build]
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

3. **Set Environment Variable**

In Netlify dashboard:
- Site Settings → Build & Deploy → Environment Variables
- Add `GITHUB_TOKEN` with a personal access token
- Token needs `public_repo` scope

4. **Update Frontend**

In `onboarding-flow.js`, update the `handleGitHubFormSubmit` method:

```javascript
const response = await fetch('/.netlify/functions/submit-org-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

const result = await response.json();

if (result.success) {
  console.log('Issue created:', result.issueUrl);
  // Show success message
} else {
  console.error('Error:', result.error);
  // Show error message
}
```

### Option 2: Vercel Serverless Functions

**Setup:**

1. **Create Vercel Function**

Create `api/submit-org-access.js`:

```javascript
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { githubUsername, pathway, interests, introduction, agreedToCoc } = req.body;

  // Validation
  if (!githubUsername || !pathway || !introduction || !agreedToCoc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create issue (same logic as Netlify example)
  const issueBody = `
## Organization Access Request

**GitHub Username:** \`${githubUsername}\`
**Pathway:** ${pathway}
**Areas of Interest:** ${interests.join(', ')}

### Introduction

${introduction}

### Agreements

- [x] Agreed to Code of Conduct

---

*Submitted via form on ${new Date().toISOString()}*
  `.trim();

  try {
    const response = await fetch(
      'https://api.github.com/repos/openwaterhealth/openwater-community/issues',
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title: `[Access Request] ${githubUsername} - ${pathway}`,
          body: issueBody,
          labels: ['org-access-request', pathway.toLowerCase()]
        })
      }
    );

    const issue = await response.json();

    return res.status(200).json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to submit request',
      details: error.message
    });
  }
}
```

2. **Configure vercel.json**

```json
{
  "functions": {
    "api/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "env": {
    "GITHUB_TOKEN": "@github-token"
  }
}
```

3. **Deploy**

```bash
vercel --prod
```

### Option 3: Cloudflare Workers

**Setup:**

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const data = await request.json();
    const { githubUsername, pathway, interests, introduction } = data;

    const issueBody = `
## Organization Access Request

**GitHub Username:** \`${githubUsername}\`
**Pathway:** ${pathway}

${introduction}
    `.trim();

    const response = await fetch(
      'https://api.github.com/repos/openwaterhealth/openwater-community/issues',
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `[Access Request] ${githubUsername}`,
          body: issueBody,
          labels: ['org-access-request']
        })
      }
    );

    return new Response(await response.text(), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Option 4: Manual Issue Creation (No Backend)

If you don't want to set up a backend, users can manually create issues:

**Update the form to:**
1. Generate a pre-filled issue URL
2. Open GitHub issue creation page in new tab

```javascript
handleGitHubFormSubmit(e) {
  const issueBody = encodeURIComponent(`
## Organization Access Request

**GitHub Username:** ${data.githubUsername}
**Pathway:** ${data.pathway}

${data.introduction}
  `);

  const issueUrl = `https://github.com/openwaterhealth/openwater-community/issues/new?` +
    `template=org-access-request.yml&` +
    `title=[Access Request] ${data.githubUsername}&` +
    `labels=org-access-request`;

  window.open(issueUrl, '_blank');
}
```

## 🔒 Security Considerations

### GitHub Token Security

**DO:**
- ✅ Store tokens as environment variables
- ✅ Use tokens with minimal scope (`public_repo` only)
- ✅ Use separate tokens for each environment
- ✅ Rotate tokens regularly
- ✅ Use GitHub Apps instead of personal tokens (production)

**DON'T:**
- ❌ Commit tokens to git
- ❌ Expose tokens in client-side code
- ❌ Use tokens with `admin` or `org` scope
- ❌ Share tokens between projects

### Rate Limiting

GitHub API limits:
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

Implement rate limiting in your function:

```javascript
// Simple in-memory rate limiter
const rateLimiter = new Map();

function checkRateLimit(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimiter.get(ip) || [];

  // Remove old requests outside window
  const recentRequests = userRequests.filter(time => now - time < windowMs);

  if (recentRequests.length >= limit) {
    return false; // Rate limited
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

### Input Validation

Always validate and sanitize input:

```javascript
function validateInput(data) {
  // Validate GitHub username format
  if (!/^[a-zA-Z0-9-]+$/.test(data.githubUsername)) {
    throw new Error('Invalid GitHub username format');
  }

  // Validate pathway
  if (!['Developer', 'Researcher', 'Clinician'].includes(data.pathway)) {
    throw new Error('Invalid pathway');
  }

  // Sanitize text input (prevent XSS in issue body)
  data.introduction = data.introduction
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 5000); // Limit length

  return data;
}
```

## 📊 Monitoring & Logging

### Log Important Events

```javascript
console.log('Org access request submitted', {
  username: githubUsername,
  pathway,
  timestamp: new Date().toISOString(),
  ip: event.headers['x-forwarded-for']
});
```

### Track Metrics

- Request count by pathway
- Success/error rates
- Response times
- Failed validation attempts

### Error Handling

```javascript
try {
  // Create issue
} catch (error) {
  // Log error details
  console.error('Issue creation failed:', {
    error: error.message,
    stack: error.stack,
    data: { githubUsername, pathway }
  });

  // Send to error tracking service (Sentry, etc.)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }

  // Return user-friendly error
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Failed to submit request. Please try creating an issue manually.',
      issueUrl: 'https://github.com/openwaterhealth/openwater-community/issues/new?template=org-access-request.yml'
    })
  };
}
```

## 🧪 Testing

### Local Testing

```bash
# Netlify
netlify dev

# Vercel
vercel dev

# Test with curl
curl -X POST http://localhost:8888/.netlify/functions/submit-org-access \
  -H "Content-Type: application/json" \
  -d '{
    "githubUsername": "testuser",
    "pathway": "Developer",
    "interests": ["Software Development"],
    "introduction": "Test submission",
    "agreedToCoc": true
  }'
```

### Integration Testing

Create `tests/api.test.js`:

```javascript
const { expect } = require('chai');
const handler = require('../netlify/functions/submit-org-access').handler;

describe('Org Access API', () => {
  it('should create GitHub issue', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        githubUsername: 'testuser',
        pathway: 'Developer',
        interests: ['Software'],
        introduction: 'Test',
        agreedToCoc: true
      })
    };

    const result = await handler(event);
    expect(result.statusCode).to.equal(200);

    const body = JSON.parse(result.body);
    expect(body.success).to.be.true;
    expect(body.issueNumber).to.be.a('number');
  });
});
```

## 📚 Related Documentation

- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

---

**Recommended Approach:** Start with Netlify Functions for easiest setup, then migrate to GitHub Apps for production scale.

**Need Help?** community@openwater.health
