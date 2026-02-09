# Maintainer Guide: Organization Access Requests

This guide explains how to process GitHub organization access requests using the automated workflow.

## 📋 Overview

The organization access automation system streamlines the process of adding new contributors to the `openwaterhealth` GitHub organization. When someone submits an access request through the website or creates an issue, an automated workflow validates and processes their request.

## 🔄 Automated Workflow

### What Happens Automatically

1. **Issue Creation**: User submits form → Creates labeled issue
2. **Validation**: Workflow checks GitHub username exists
3. **Welcome Comment**: Posts welcome message with next steps
4. **Labeling**: Adds `pending-review` and pathway labels
5. **Discord Notification** (if configured): Alerts maintainers

### What Requires Manual Action

- **Reviewing the request**: Ensure user seems legitimate
- **Sending the invitation**: Add user to GitHub organization
- **Closing the issue**: Mark as complete

## 🚀 Processing a Request

### Step 1: Review the Issue

When a new org access request is created, you'll see:

- **Labels**: `org-access-request`, `pending-review`, pathway label
- **Automated comment**: Welcome message from the bot
- **Issue body**: User's GitHub username, pathway, interests, and introduction

**Review checklist:**
- ✅ GitHub username is valid (automated check)
- ✅ Introduction seems legitimate (not spam/bot)
- ✅ User has agreed to Code of Conduct
- ✅ Pathway and interests are clear

### Step 2: Invite to Organization

**Option A: GitHub UI (Recommended)**

1. Go to [Organization People Settings](https://github.com/orgs/openwaterhealth/people)
2. Click "Invite member"
3. Enter the GitHub username (e.g., `@username`)
4. Select role: **Member** (not Owner)
5. Click "Send invitation"

**Option B: GitHub CLI**

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /orgs/openwaterhealth/memberships/USERNAME
```

**Option C: Bot Command (Future)**

```
/invite @username
```

### Step 3: Update the Issue

After sending the invitation:

1. **Comment on the issue:**
   ```markdown
   ✅ Invitation sent to @username!

   You should receive an email from GitHub shortly. Please:
   1. Accept the organization invitation
   2. Set your organization visibility (public or private)
   3. Join our Discord: https://discord.gg/openwater
   4. Check out your pathway guide: [link]

   Welcome to the Openwater community! 🎉
   ```

2. **Update labels:**
   - Remove `pending-review`
   - Add `invited`

3. **Close the issue** (or wait for user to confirm acceptance)

### Step 4: Follow Up (Optional)

For new contributors, consider:

- Introducing them in the `#introductions` Discord channel
- Suggesting good first issues based on their interests
- Inviting them to the next community call
- Adding them to relevant GitHub teams (e.g., `@openwaterhealth/developers`)

## ⚠️ Handling Edge Cases

### Invalid or Spam Requests

If a request appears suspicious:

1. **Add label**: `needs-clarification`
2. **Comment**: Ask for more information
3. **Wait 7 days**: If no response, close with `wontfix` label
4. **Block if necessary**: Use GitHub's block feature for persistent spam

Example comment:
```markdown
Hi @username,

Thanks for your interest! To process your request, we need a bit more information:

- Tell us more about your background and experience
- What specific projects or areas interest you?
- Have you reviewed our contribution guidelines?

Looking forward to hearing from you!
```

### Duplicate Requests

If a user submits multiple requests:

1. Close duplicate issues with comment:
   ```markdown
   Duplicate of #[original-issue-number]. Please continue the discussion there.
   ```

2. Process only the original request

### User Already in Organization

If the GitHub username is already a member:

1. Comment:
   ```markdown
   It looks like @username is already a member of the organization!

   - [View your profile](https://github.com/orgs/openwaterhealth/people)
   - If you can't see repositories, check your organization visibility settings
   - Need help? Join us on Discord: https://discord.gg/openwater
   ```

2. Add label: `already-member`
3. Close the issue

## 📊 Monitoring & Metrics

### Key Metrics to Track

- **Response time**: Time from request to invitation
- **Acceptance rate**: % of invited users who accept
- **Active contributors**: % who make contributions within 30 days
- **Pathway distribution**: Developer vs Researcher vs Clinician

### Viewing Statistics

**GitHub Issues Dashboard:**
```
is:issue label:org-access-request
```

**Filter by status:**
- Pending: `is:open label:pending-review`
- Invited: `is:open label:invited`
- Completed: `is:closed label:org-access-request`

**By pathway:**
- Developers: `label:developer`
- Researchers: `label:researcher`
- Clinicians: `label:clinician`

## 🔧 Workflow Configuration

### Environment Variables

The workflow uses these repository secrets/variables:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions (read-only by default)
- `DISCORD_WEBHOOK_URL` (optional): Discord webhook for notifications

### Setting Up Discord Notifications

1. Create a Discord webhook in your server:
   - Server Settings → Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. Add to repository secrets:
   - Repository Settings → Secrets and variables → Actions
   - Add variable: `DISCORD_WEBHOOK_URL` = `your-webhook-url`

3. Test with a sample request

### Customizing the Workflow

Edit `.github/workflows/org-access-automation.yml` to customize:

- Welcome message content
- Labels applied
- Discord notification format
- Validation rules

## 🐛 Troubleshooting

### Workflow Not Triggering

**Check:**
- Issue has `org-access-request` label
- Workflow file is in `main` branch
- Repository has Actions enabled

**Manual trigger:**
- Go to Actions → "GitHub Org Access Automation"
- Click "Run workflow"
- Enter issue number

### Validation Failing

**Common causes:**
- GitHub username has typo
- User hasn't created GitHub account yet
- User changed their username

**Solution:**
- Ask user to verify their GitHub username
- Check https://github.com/username
- User can update the issue body

### Discord Notifications Not Working

**Check:**
- `DISCORD_WEBHOOK_URL` variable is set
- Webhook URL is valid and not expired
- Discord server settings allow webhooks

**Test:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"content":"Test notification"}' \
  YOUR_WEBHOOK_URL
```

## 📚 Related Documentation

- [Contribution Guidelines](https://github.com/openwaterhealth/.github/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/openwaterhealth/.github/blob/main/CODE_OF_CONDUCT.md)
- [Community Website](https://openwaterhealth.github.io/openwater-community/)
- [Getting Started Guide](https://openwaterhealth.github.io/openwater-community/get-started.html)

## 🤝 Best Practices

### Response Time Goals

- **Initial automated response**: Immediate (< 1 minute)
- **Maintainer review**: < 24 hours
- **Invitation sent**: < 48 hours

### Communication

- **Be welcoming**: New contributors are the lifeblood of the project
- **Be clear**: Explain next steps explicitly
- **Be helpful**: Point to resources and offer guidance
- **Be patient**: Some contributors are new to open source

### Security

- **Don't share tokens**: Never post GitHub tokens in issues
- **Verify identities**: Check GitHub profiles for legitimacy
- **Watch for spam**: Be alert for bot accounts or suspicious behavior
- **Protect the org**: Only invite legitimate contributors

## 📞 Getting Help

If you need assistance with the automation system:

- **Technical issues**: Create an issue in this repository
- **Policy questions**: Discuss in `#maintainers` Discord channel
- **Urgent matters**: Email community@openwater.health

---

**Last Updated:** 2025-02-09
**Maintainer:** Openwater Community Team
**Questions?** community@openwater.health
