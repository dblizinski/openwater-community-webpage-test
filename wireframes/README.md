# Wireframes - Openwater Community Website Refactoring

This directory contains HTML wireframes for the new and enhanced pages in the Openwater community website refactoring project.

## Purpose

These wireframes show the **structure, content, and functionality** of each page WITHOUT final styling. They're designed for review and approval before full implementation.

## Files

### 1. get-started-enhanced.html
**Enhanced version of existing Get Started page**

**New Features:**
- ✨ Interactive pathway selector (3 cards: Developer, Researcher, Clinician)
- ✨ Progress-tracking checklist (saved to localStorage)
- ✨ Sticky quick actions bar
- ✨ Automated GitHub org access request form
- ✨ Dynamic content based on selected pathway

**Key Sections:**
- Hero with pathway selector
- Interactive onboarding checklist (5 steps)
- Pathway-specific quick start guides
- GitHub org access automation
- FAQ section

### 2. researchers.html
**NEW page for academic researchers**

**Key Sections:**
1. What is Openwater? (technology overview)
2. Research Collaboration (partnership process, data sharing, co-authorship, IP)
3. Model Commons (publish/access research)
4. Getting Started (4-step process)
5. Research Resources

**Content Dependencies:**
- ❌ Research collaboration policy (500 words) - **NEEDED FROM STAKEHOLDERS**
- ❌ Data sharing details - **NEEDED FROM STAKEHOLDERS**
- ❌ Co-authorship guidelines - **NEEDED FROM STAKEHOLDERS**
- ❌ IP framework - **NEEDED FROM STAKEHOLDERS**

### 3. clinicians.html
**NEW page for physicians and clinical practitioners**

**Key Sections:**
1. Clinical Applications (use cases, benefits, safety, regulatory status)
2. Clinical Feedback & Input (why it matters, process, advisory board)
3. Clinical Studies & Trials (active studies, how to participate, IRB support)
4. Getting Started (4-step process)
5. Clinical Resources

**Content Dependencies:**
- ❌ Regulatory status (300 words) - **NEEDED FROM STAKEHOLDERS**
- ❌ Clinical engagement guidelines (500 words) - **NEEDED FROM STAKEHOLDERS**
- ❌ IRB/ethics support details - **NEEDED FROM STAKEHOLDERS**
- ❌ HIPAA/privacy compliance - **NEEDED FROM STAKEHOLDERS**
- ❌ Active clinical studies list - **NEEDED FROM STAKEHOLDERS**

### 4. community-enhanced.html
**Enhanced version of existing Community page**

**New Dynamic Features:**
- ✨ Live GitHub statistics (repos, stars, contributors, active repos)
- ✨ Recent activity feed (commits, PRs, issues across repos)
- ✨ Contributor leaderboard with recognition badges
- ✨ Live Discord member count and online status

**Technical Implementation:**
- JavaScript modules: `github-stats.js`, `activity-feed.js`, `contributor-board.js`, `discord-widget.js`
- LocalStorage caching (30-min TTL)
- GitHub Actions pre-fetch fallback
- Rate limit handling

## Review Checklist

When reviewing these wireframes, please consider:

- [ ] **Structure & Flow:** Does the page organization make sense?
- [ ] **Content Placement:** Is information in logical sections?
- [ ] **User Journey:** Can users easily accomplish their goals?
- [ ] **Pathway Clarity:** Are the three pathways clearly differentiated?
- [ ] **CTAs:** Are calls-to-action prominent and clear?
- [ ] **Missing Elements:** Anything we forgot to include?

## Next Steps

1. **Review wireframes** for structure and content
2. **Identify any missing sections** or features
3. **Provide stakeholder content** for placeholder sections
4. **Approve wireframes** before proceeding to full implementation

Once approved, we'll proceed with:
- Phase 1: Implement JavaScript modules for dynamic features
- Phase 2: Create styled HTML pages based on these wireframes
- Phase 3: Integrate with GitHub Actions for data pre-fetching
- Phase 4: Testing and refinement

## Questions?

- What content do you want prioritized for placeholder sections?
- Are there any sections that should be added or removed?
- Do the three pathways adequately serve your contributor personas?
- Any concerns about the technical approach (JavaScript, APIs, caching)?

## Technical Notes

All pages will:
- Use the **existing design system** (colors, fonts, card styles)
- Be **mobile-responsive** (same breakpoints as current site)
- Have **consistent navigation** across all pages
- Include **progressive enhancement** (works without JavaScript for basic content)
