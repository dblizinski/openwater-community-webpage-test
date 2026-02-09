/**
 * Onboarding Flow Module
 * Handles interactive onboarding wizard with progress tracking and localStorage persistence
 *
 * Features:
 * - Pathway selection state management
 * - Checklist progress tracking with localStorage
 * - Dynamic content switching based on pathway
 * - Smooth animations and transitions
 * - Form integration for GitHub org access
 *
 * @module onboarding-flow
 */

export default class OnboardingFlow {
    constructor() {
        // Configuration
        this.config = {
            storagePrefix: 'ow_onboarding_',
            pathways: ['developer', 'researcher', 'clinician'],
            totalSteps: 5,
            animationDuration: 300
        };

        // State
        this.state = {
            selectedPathway: null,
            completedSteps: new Set(),
            formData: {}
        };

        // DOM Elements
        this.elements = {
            pathwayCards: document.querySelectorAll('.pathway-card'),
            pathwayContents: document.querySelectorAll('.pathway-content'),
            checkboxes: document.querySelectorAll('.step-checkbox'),
            progressBar: document.getElementById('progressBar'),
            faqQuestions: document.querySelectorAll('.faq-question'),
            githubForm: document.getElementById('github-access-form'),
            pathwaySelect: document.getElementById('pathway'),
            quickActionsBar: document.querySelector('.quick-actions-bar')
        };

        this.init();
    }

    /**
     * Initialize the onboarding flow
     */
    init() {
        console.log('🚀 Initializing Onboarding Flow Module');

        // Load saved progress
        this.loadProgress();

        // Set up event listeners
        this.setupPathwaySelector();
        this.setupChecklistTracking();
        this.setupFAQAccordion();
        this.setupGitHubForm();
        this.setupQuickActions();
        this.setupSmoothScroll();

        // Update UI
        this.updateUI();

        console.log('✅ Onboarding Flow initialized with state:', this.state);
    }

    /**
     * Load saved progress from localStorage
     */
    loadProgress() {
        try {
            // Load selected pathway
            const savedPathway = localStorage.getItem(`${this.config.storagePrefix}pathway`);
            if (savedPathway && this.config.pathways.includes(savedPathway)) {
                this.state.selectedPathway = savedPathway;
            }

            // Load completed steps
            for (let i = 1; i <= this.config.totalSteps; i++) {
                const saved = localStorage.getItem(`${this.config.storagePrefix}step_${i}`);
                if (saved === 'true') {
                    this.state.completedSteps.add(i);
                }
            }

            // Load form data
            const savedFormData = localStorage.getItem(`${this.config.storagePrefix}form_data`);
            if (savedFormData) {
                try {
                    this.state.formData = JSON.parse(savedFormData);
                } catch (e) {
                    console.warn('Could not parse saved form data:', e);
                }
            }

            console.log('📂 Loaded progress:', {
                pathway: this.state.selectedPathway,
                completedSteps: Array.from(this.state.completedSteps),
                formData: this.state.formData
            });
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        try {
            // Save selected pathway
            if (this.state.selectedPathway) {
                localStorage.setItem(
                    `${this.config.storagePrefix}pathway`,
                    this.state.selectedPathway
                );
            }

            // Save completed steps
            for (let i = 1; i <= this.config.totalSteps; i++) {
                localStorage.setItem(
                    `${this.config.storagePrefix}step_${i}`,
                    this.state.completedSteps.has(i)
                );
            }

            // Save form data
            if (Object.keys(this.state.formData).length > 0) {
                localStorage.setItem(
                    `${this.config.storagePrefix}form_data`,
                    JSON.stringify(this.state.formData)
                );
            }

            console.log('💾 Progress saved');
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    /**
     * Set up pathway selector
     */
    setupPathwaySelector() {
        this.elements.pathwayCards.forEach(card => {
            // Card click handler
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on sub-pathways
                if (e.target.closest('.sub-pathways')) return;

                const pathway = card.getAttribute('data-pathway');
                this.selectPathway(pathway);
            });

            // Button click handler
            const button = card.querySelector('button');
            if (button) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pathway = card.getAttribute('data-pathway');
                    this.selectPathway(pathway);
                });
            }
        });
    }

    /**
     * Select a pathway
     * @param {string} pathway - The pathway to select (developer, researcher, clinician)
     */
    selectPathway(pathway) {
        if (!this.config.pathways.includes(pathway)) {
            console.error('Invalid pathway:', pathway);
            return;
        }

        console.log('🎯 Selecting pathway:', pathway);

        // Update state
        this.state.selectedPathway = pathway;

        // Update cards
        this.elements.pathwayCards.forEach(card => {
            card.classList.remove('selected');
            if (card.getAttribute('data-pathway') === pathway) {
                card.classList.add('selected');
            }
        });

        // Update content with smooth transition
        this.elements.pathwayContents.forEach(content => {
            if (content.id === `${pathway}-content`) {
                content.style.opacity = '0';
                content.classList.add('active');
                setTimeout(() => {
                    content.style.opacity = '1';
                    content.style.transition = 'opacity 0.3s ease-in-out';
                }, 10);
            } else {
                content.classList.remove('active');
            }
        });

        // Update pathway select in form
        if (this.elements.pathwaySelect) {
            this.elements.pathwaySelect.value = pathway;
        }

        // Mark first step as complete
        this.completeStep(1);

        // Save progress
        this.saveProgress();

        // Scroll to checklist
        setTimeout(() => {
            const checklistSection = document.getElementById('checklist');
            if (checklistSection) {
                checklistSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 300);
    }

    /**
     * Set up checklist tracking
     */
    setupChecklistTracking() {
        this.elements.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const step = parseInt(checkbox.getAttribute('data-step'));

                if (checkbox.checked) {
                    this.completeStep(step);
                } else {
                    this.uncompleteStep(step);
                }

                this.saveProgress();
                this.updateProgressBar();
            });

            // Restore saved state
            const step = parseInt(checkbox.getAttribute('data-step'));
            if (this.state.completedSteps.has(step)) {
                checkbox.checked = true;
                checkbox.closest('.checklist-item').classList.add('completed');
            }
        });

        // Update progress bar on init
        this.updateProgressBar();
    }

    /**
     * Complete a checklist step
     * @param {number} step - Step number to complete
     */
    completeStep(step) {
        this.state.completedSteps.add(step);

        const checkbox = document.querySelector(`[data-step="${step}"]`);
        if (checkbox) {
            checkbox.checked = true;
            const item = checkbox.closest('.checklist-item');
            if (item) {
                item.classList.add('completed');

                // Add celebratory animation
                item.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                    item.style.transition = 'transform 0.3s ease-in-out';
                }, 200);
            }
        }

        console.log(`✅ Step ${step} completed`);
    }

    /**
     * Uncomplete a checklist step
     * @param {number} step - Step number to uncomplete
     */
    uncompleteStep(step) {
        this.state.completedSteps.delete(step);

        const checkbox = document.querySelector(`[data-step="${step}"]`);
        if (checkbox) {
            const item = checkbox.closest('.checklist-item');
            if (item) {
                item.classList.remove('completed');
            }
        }

        console.log(`⬜ Step ${step} uncompleted`);
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const percentage = (this.state.completedSteps.size / this.config.totalSteps) * 100;

        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percentage}%`;
            this.elements.progressBar.style.transition = 'width 0.5s ease-in-out';
        }

        console.log(`📊 Progress: ${this.state.completedSteps.size}/${this.config.totalSteps} (${percentage.toFixed(0)}%)`);

        // Celebrate when all steps complete
        if (this.state.completedSteps.size === this.config.totalSteps) {
            this.celebrateCompletion();
        }
    }

    /**
     * Celebrate checklist completion
     */
    celebrateCompletion() {
        console.log('🎉 Onboarding checklist complete!');

        // Could add confetti animation or success modal here
        // For now, just log success
        setTimeout(() => {
            if (confirm('🎉 Congratulations! You\'ve completed the onboarding checklist. Would you like to visit the Community page to see what\'s happening?')) {
                window.location.href = 'community.html';
            }
        }, 500);
    }

    /**
     * Set up FAQ accordion
     */
    setupFAQAccordion() {
        this.elements.faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.closest('.faq-item');
                const wasExpanded = faqItem.classList.contains('expanded');

                // Close all other FAQs
                document.querySelectorAll('.faq-item').forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('expanded');
                    }
                });

                // Toggle this FAQ
                faqItem.classList.toggle('expanded');

                // Smooth scroll to FAQ if expanding
                if (!wasExpanded) {
                    setTimeout(() => {
                        faqItem.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                        });
                    }, 100);
                }
            });
        });
    }

    /**
     * Set up GitHub form
     */
    setupGitHubForm() {
        if (!this.elements.githubForm) return;

        // Pre-fill form with saved data
        if (this.state.formData.githubUsername) {
            const usernameInput = document.getElementById('github-username');
            if (usernameInput) usernameInput.value = this.state.formData.githubUsername;
        }

        if (this.state.selectedPathway && this.elements.pathwaySelect) {
            this.elements.pathwaySelect.value = this.state.selectedPathway;
        }

        // Handle form submission
        this.elements.githubForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGitHubFormSubmit(e);
        });

        // Auto-save form data as user types
        const formInputs = this.elements.githubForm.querySelectorAll('input[type="text"], input[type="email"], textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.saveFormData();
            });
        });
    }

    /**
     * Save form data to state
     */
    saveFormData() {
        const usernameInput = document.getElementById('github-username');
        const introInput = document.getElementById('intro');

        if (usernameInput && usernameInput.value) {
            this.state.formData.githubUsername = usernameInput.value;
        }

        if (introInput && introInput.value) {
            this.state.formData.introduction = introInput.value;
        }

        this.saveProgress();
    }

    /**
     * Handle GitHub form submission
     * @param {Event} e - Submit event
     */
    async handleGitHubFormSubmit(e) {
        const formData = new FormData(this.elements.githubForm);
        const interests = Array.from(formData.getAll('interest'));

        const data = {
            githubUsername: formData.get('github-username'),
            pathway: formData.get('pathway'),
            interests: interests,
            introduction: formData.get('intro'),
            agreedToCoc: formData.get('coc') ? true : false,
            timestamp: new Date().toISOString()
        };

        console.log('📝 GitHub Access Request Submitted:', data);

        const successMsg = document.getElementById('form-success');
        const submitButton = this.elements.githubForm.querySelector('button[type="submit"]');

        try {
            // Disable submit button
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
            }

            // Try to submit via API
            const result = await this.submitToAPI(data);

            if (result.success) {
                // Success! Show success message with issue link
                if (successMsg) {
                    successMsg.innerHTML = `
                        ✅ Your request has been submitted successfully!
                        <br><br>
                        <strong>Issue #${result.issueNumber}</strong> has been created.
                        <a href="${result.issueUrl}" target="_blank" style="color: #0891B2; text-decoration: underline;">
                            View your request on GitHub →
                        </a>
                        <br><br>
                        A maintainer will review your request within 24 hours.
                    `;
                    successMsg.classList.add('show');
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }

                // Mark step 3 as complete (GitHub access requested)
                this.completeStep(3);

                // Clear saved form data
                this.state.formData = {};
                this.saveProgress();

                // Reset form
                this.elements.githubForm.reset();

                // Re-select the pathway in the form
                if (this.state.selectedPathway && this.elements.pathwaySelect) {
                    this.elements.pathwaySelect.value = this.state.selectedPathway;
                }

                // Hide success message after 10 seconds
                setTimeout(() => {
                    if (successMsg) {
                        successMsg.classList.remove('show');
                    }
                }, 10000);

                console.log('✅ Issue created:', result.issueUrl);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Error submitting form:', error);

            // Show error message with fallback option
            if (successMsg) {
                successMsg.innerHTML = `
                    ⚠️ ${error.message || 'Could not submit automatically.'}
                    <br><br>
                    <strong>Please create an issue manually:</strong>
                    <br>
                    <a href="https://github.com/openwaterhealth/openwater-community/issues/new?template=org-access-request.yml&title=[Access Request] ${encodeURIComponent(data.githubUsername)}"
                       target="_blank"
                       class="btn btn-primary"
                       style="display: inline-block; margin-top: 10px; background: #0891B2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                        Create Issue on GitHub →
                    </a>
                `;
                successMsg.style.background = '#FFF3CD';
                successMsg.style.borderColor = '#FFC107';
                successMsg.style.color = '#664D03';
                successMsg.classList.add('show');
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Don't reset form so user can try again or use manual method
        } finally {
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Access Request';
            }
        }
    }

    /**
     * Submit org access request to API
     * @param {Object} data - Form data
     * @returns {Promise<Object>} API response
     */
    async submitToAPI(data) {
        // API endpoint - will use Netlify Functions if deployed on Netlify
        // Falls back to manual issue creation if API is not available
        const apiEndpoint = '/.netlify/functions/submit-org-access';

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return result;

        } catch (error) {
            // Check if it's a network error or API not available
            if (error.message.includes('fetch') || error.message.includes('404')) {
                console.log('API endpoint not available, falling back to manual issue creation');
                return {
                    success: false,
                    error: 'API not available. Please use the manual issue creation link below.',
                    fallbackUrl: `https://github.com/openwaterhealth/openwater-community/issues/new?template=org-access-request.yml`
                };
            }

            throw error;
        }
    }

    /**
     * Set up quick actions bar
     */
    setupQuickActions() {
        if (!this.elements.quickActionsBar) return;

        const buttons = this.elements.quickActionsBar.querySelectorAll('button');

        buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
                switch(index) {
                    case 0: // Request GitHub Access
                        document.getElementById('github-form')?.scrollIntoView({
                            behavior: 'smooth'
                        });
                        break;
                    case 1: // Join Discord
                        this.completeStep(2);
                        window.open('https://discord.gg/openwater', '_blank');
                        break;
                    case 2: // View Good First Issues
                        this.completeStep(4);
                        window.open('https://github.com/openwaterhealth/openwater-community/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22', '_blank');
                        break;
                    case 3: // Schedule Call
                        window.open('https://meetings.hubspot.com/openwater', '_blank');
                        break;
                }
            });
        });

        // Update Discord button with dynamic member count
        this.updateDiscordButton();
    }

    /**
     * Update Discord button with member count
     */
    async updateDiscordButton() {
        const discordButton = this.elements.quickActionsBar?.querySelector('button:nth-child(2)');
        if (!discordButton) return;

        try {
            // Try to get Discord widget data
            // This would use the discord-widget module in production
            const cachedWidget = localStorage.getItem('ow_discord_widget');
            if (cachedWidget) {
                const widget = JSON.parse(cachedWidget);
                if (widget.data && widget.data.presence_count) {
                    discordButton.textContent = `Join Discord (${widget.data.presence_count.toLocaleString()}+ members)`;
                }
            }
        } catch (error) {
            console.log('Could not load Discord member count');
        }
    }

    /**
     * Set up smooth scroll for anchor links
     */
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href !== '#' && document.querySelector(href)) {
                    e.preventDefault();
                    document.querySelector(href).scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        // Restore selected pathway
        if (this.state.selectedPathway) {
            const card = document.querySelector(`[data-pathway="${this.state.selectedPathway}"]`);
            if (card) {
                card.classList.add('selected');
            }

            const content = document.getElementById(`${this.state.selectedPathway}-content`);
            if (content) {
                content.classList.add('active');
            }
        }

        // Update progress bar
        this.updateProgressBar();
    }

    /**
     * Get completion percentage
     * @returns {number} Percentage complete (0-100)
     */
    getCompletionPercentage() {
        return (this.state.completedSteps.size / this.config.totalSteps) * 100;
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            ...this.state,
            completedSteps: Array.from(this.state.completedSteps),
            completionPercentage: this.getCompletionPercentage()
        };
    }

    /**
     * Reset onboarding progress
     */
    resetProgress() {
        if (!confirm('Are you sure you want to reset your onboarding progress? This cannot be undone.')) {
            return;
        }

        // Clear state
        this.state.selectedPathway = null;
        this.state.completedSteps.clear();
        this.state.formData = {};

        // Clear localStorage
        for (let i = 1; i <= this.config.totalSteps; i++) {
            localStorage.removeItem(`${this.config.storagePrefix}step_${i}`);
        }
        localStorage.removeItem(`${this.config.storagePrefix}pathway`);
        localStorage.removeItem(`${this.config.storagePrefix}form_data`);

        // Reload page
        window.location.reload();
    }
}

// Auto-initialize if on the get-started page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('pathway-selector')) {
            window.onboardingFlow = new OnboardingFlow();
        }
    });
} else {
    if (document.getElementById('pathway-selector')) {
        window.onboardingFlow = new OnboardingFlow();
    }
}
