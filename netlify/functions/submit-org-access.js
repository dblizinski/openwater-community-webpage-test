/**
 * Netlify Serverless Function: Submit Organization Access Request
 *
 * This function handles form submissions from the Get Started page
 * and creates GitHub issues for organization access requests.
 *
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal access token with 'public_repo' scope
 *
 * Deployment:
 * 1. Deploy site to Netlify
 * 2. Add GITHUB_TOKEN environment variable in Netlify dashboard
 * 3. Update frontend API endpoint to '/.netlify/functions/submit-org-access'
 */

const fetch = require('node-fetch');

/**
 * Rate limiter to prevent spam
 */
const rateLimiter = new Map();

function checkRateLimit(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimiter.get(ip) || [];

  // Remove old requests
  const recentRequests = userRequests.filter(time => now - time < windowMs);

  if (recentRequests.length >= limit) {
    return false;
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);

  // Cleanup old entries
  if (rateLimiter.size > 1000) {
    const entries = Array.from(rateLimiter.entries());
    entries.slice(0, 500).forEach(([key]) => rateLimiter.delete(key));
  }

  return true;
}

/**
 * Validate and sanitize input data
 */
function validateInput(data) {
  const errors = [];

  // Validate GitHub username
  if (!data.githubUsername) {
    errors.push('GitHub username is required');
  } else if (!/^[a-zA-Z0-9-]+$/.test(data.githubUsername)) {
    errors.push('Invalid GitHub username format');
  } else if (data.githubUsername.length > 39) {
    errors.push('GitHub username too long');
  }

  // Validate pathway
  if (!data.pathway) {
    errors.push('Pathway is required');
  } else if (!['Developer', 'Researcher', 'Clinician'].includes(data.pathway)) {
    errors.push('Invalid pathway');
  }

  // Validate interests
  if (!Array.isArray(data.interests) || data.interests.length === 0) {
    errors.push('At least one area of interest is required');
  }

  // Validate introduction
  if (!data.introduction) {
    errors.push('Introduction is required');
  } else if (data.introduction.length < 50) {
    errors.push('Introduction too short (minimum 50 characters)');
  } else if (data.introduction.length > 5000) {
    errors.push('Introduction too long (maximum 5000 characters)');
  }

  // Validate Code of Conduct agreement
  if (!data.agreedToCoc) {
    errors.push('Must agree to Code of Conduct');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  // Sanitize text input
  return {
    githubUsername: data.githubUsername.trim(),
    pathway: data.pathway,
    interests: data.interests.map(i => i.trim()),
    introduction: data.introduction.trim(),
    agreedToCoc: data.agreedToCoc,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verify GitHub user exists
 */
async function verifyGitHubUser(username, token) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 404) {
      return { exists: false, error: 'GitHub user not found' };
    }

    if (!response.ok) {
      return { exists: false, error: 'Could not verify GitHub user' };
    }

    return { exists: true };
  } catch (error) {
    console.error('Error verifying GitHub user:', error);
    return { exists: false, error: 'Verification failed' };
  }
}

/**
 * Create GitHub issue
 */
async function createGitHubIssue(data, token) {
  const issueBody = `
## Organization Access Request

**GitHub Username:** \`@${data.githubUsername}\`
**Pathway:** ${data.pathway}
**Areas of Interest:** ${data.interests.join(', ')}

### Introduction

${data.introduction}

### Agreements

- [x] I have read and agree to follow the [Code of Conduct](https://github.com/openwaterhealth/.github/blob/main/CODE_OF_CONDUCT.md)
- [x] I have read the [Contribution Guidelines](https://github.com/openwaterhealth/.github/blob/main/CONTRIBUTING.md)
- [x] I understand this is an open-source project and contributions are voluntary

---

**Submitted:** ${data.timestamp}
**Source:** Automated web form
  `.trim();

  const response = await fetch(
    'https://api.github.com/repos/openwaterhealth/openwater-community/issues',
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Openwater-Community-Bot'
      },
      body: JSON.stringify({
        title: `[Access Request] ${data.githubUsername} - ${data.pathway}`,
        body: issueBody,
        labels: ['org-access-request', data.pathway.toLowerCase()]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create GitHub issue');
  }

  return await response.json();
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      })
    };
  }

  try {
    // Check for GitHub token
    if (!process.env.GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Server configuration error. Please contact an administrator.',
          fallbackUrl: 'https://github.com/openwaterhealth/openwater-community/issues/new?template=org-access-request.yml'
        })
      };
    }

    // Rate limiting
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Too many requests. Please wait a minute and try again.',
          fallbackUrl: 'https://github.com/openwaterhealth/openwater-community/issues/new?template=org-access-request.yml'
        })
      };
    }

    // Parse and validate input
    const rawData = JSON.parse(event.body);
    const validatedData = validateInput(rawData);

    console.log('Processing org access request:', {
      username: validatedData.githubUsername,
      pathway: validatedData.pathway,
      timestamp: validatedData.timestamp,
      ip: clientIp
    });

    // Verify GitHub user exists
    const userVerification = await verifyGitHubUser(
      validatedData.githubUsername,
      process.env.GITHUB_TOKEN
    );

    if (!userVerification.exists) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `GitHub user @${validatedData.githubUsername} not found. Please check the username and try again.`,
          details: userVerification.error
        })
      };
    }

    // Create GitHub issue
    const issue = await createGitHubIssue(validatedData, process.env.GITHUB_TOKEN);

    console.log('Issue created successfully:', {
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      username: validatedData.githubUsername
    });

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Your request has been submitted successfully!',
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        nextSteps: [
          'A maintainer will review your request within 24 hours',
          'You will receive an email invitation to join the organization',
          'Check your email and accept the invitation',
          'Join our Discord community: https://discord.gg/openwater'
        ]
      })
    };

  } catch (error) {
    console.error('Error processing request:', {
      error: error.message,
      stack: error.stack
    });

    // Return error response
    return {
      statusCode: error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        fallbackUrl: 'https://github.com/openwaterhealth/openwater-community/issues/new?template=org-access-request.yml',
        fallbackMessage: 'You can manually create an issue using the link above.'
      })
    };
  }
};
