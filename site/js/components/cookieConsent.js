(function () {
    'use strict';

    // Cookie Management Class
    class CookieConsent {
        constructor() {
            this.banner = document.getElementById('cookieConsent');
            this.modal = document.getElementById('cookiePreferencesModal');
            
            // Banner buttons
            this.acceptAllBtn = document.getElementById('acceptAllBtn');
            this.rejectAllBtn = document.getElementById('rejectAllBtn');
            this.managePrefLink = document.getElementById('managePrefLink');
            
            // Modal buttons
            this.closeModalBtn = document.getElementById('closeModalBtn');
            this.modalAcceptAllBtn = document.getElementById('modalAcceptAllBtn');
            this.modalRejectAllBtn = document.getElementById('modalRejectAllBtn');
            this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
            
            // Category checkboxes
            this.analyticsCookies = document.getElementById('analyticsCookies');
            this.marketingCookies = document.getElementById('marketingCookies');
            this.unclassifiedCookies = document.getElementById('unclassifiedCookies');
            
            this.init();
        }

        init() {
            if (!this.banner || !this.modal) return;

            // Load saved preferences
            this.loadPreferences();

            // Banner event listeners
            this.acceptAllBtn?.addEventListener('click', () => this.acceptAll());
            this.rejectAllBtn?.addEventListener('click', () => this.rejectAll());
            this.managePrefLink?.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });

            // Modal event listeners
            this.closeModalBtn?.addEventListener('click', () => this.closeModal());
            this.modalAcceptAllBtn?.addEventListener('click', () => this.acceptAllFromModal());
            this.modalRejectAllBtn?.addEventListener('click', () => this.rejectAllFromModal());
            this.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());

            // Close modal on overlay click
            this.modal.querySelector('.cookie-modal-overlay')?.addEventListener('click', () => this.closeModal());

            // Prevent toggle clicks from triggering accordion
            const toggleLabels = document.querySelectorAll('.toggle-label');
            toggleLabels.forEach(label => {
                label.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            });

            // Prevent checkbox container clicks from triggering accordion
            const toggleContainers = document.querySelectorAll('.cookie-toggle');
            toggleContainers.forEach(container => {
                container.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            });

            // Category accordion functionality
            this.initAccordions();

            // Show banner if needed (wait for preloader)
            document.addEventListener('preloaderComplete', () => {
                setTimeout(() => this.showBannerIfNeeded(), 300);
            }, { once: true });
        }

        initAccordions() {
            const headers = document.querySelectorAll('.cookie-category-header');
            
            // Ensure first category is expanded on load
            const firstCategory = document.querySelector('.cookie-category');
            if (firstCategory && !firstCategory.classList.contains('expanded')) {
                firstCategory.classList.add('expanded');
            }
            
            headers.forEach(header => {
                header.addEventListener('click', (e) => {
                    // Don't toggle if clicking on toggle switch or label
                    if (e.target.closest('.cookie-toggle') || e.target.closest('.toggle-label')) {
                        return;
                    }
                    
                    const category = header.closest('.cookie-category');
                    category.classList.toggle('expanded');
                });
            });
        }

        showBannerIfNeeded() {
            const consent = localStorage.getItem('cookie_consent');
            if (!consent) {
                this.banner.classList.add('show');
            }
        }

        loadPreferences() {
            const preferences = this.getPreferences();
            
            if (this.analyticsCookies) {
                this.analyticsCookies.checked = preferences.analytics;
            }
            if (this.marketingCookies) {
                this.marketingCookies.checked = preferences.marketing;
            }
            if (this.unclassifiedCookies) {
                this.unclassifiedCookies.checked = preferences.unclassified;
            }
        }

        getPreferences() {
            const stored = localStorage.getItem('cookie_preferences');
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing cookie preferences:', e);
                }
            }
            
            return {
                necessary: true,
                analytics: false,
                marketing: false,
                unclassified: false
            };
        }

        savePreferences(preferences) {
            localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
            localStorage.setItem('cookie_consent', 'custom');
            
            // Load GA4 if analytics enabled
            if (preferences.analytics) {
                this.loadGA4();
            }
        }

        loadGA4() {
            // Check if GA4 is already loaded
            if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
                return;
            }

            // Initialize dataLayer if not exists
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                window.dataLayer.push(arguments);
            }
            window.gtag = gtag;

            // Create and load GA4 script
            const script = document.createElement("script");
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtag/js?id=UA-72482257-1";
            document.head.appendChild(script);

            script.onload = () => {
                gtag("js", new Date());
                gtag("config", "UA-72482257-1", {
                    anonymize_ip: true,
                });

                // Track consent event
                gtag('event', 'cookie_consent', {
                    consent_action: 'accepted',
                    analytics: true
                });
            };
        }

        acceptAll() {
            const preferences = {
                necessary: true,
                analytics: true,
                marketing: true,
                unclassified: true
            };
            
            this.savePreferences(preferences);
            localStorage.setItem('cookie_consent', 'accepted');
            
            if (typeof window.loadGA4 === 'function') {
                window.loadGA4();
                
                setTimeout(() => {
                    if (typeof gtag === 'function') {
                        gtag('event', 'cookie_consent', {
                            consent_action: 'accepted'
                        });
                    }
                }, 500);
            }
            
            this.banner.classList.remove('show');
        }

        rejectAll() {
            const preferences = {
                necessary: true,
                analytics: false,
                marketing: false,
                unclassified: false
            };
            
            this.savePreferences(preferences);
            localStorage.setItem('cookie_consent', 'declined');
            this.banner.classList.remove('show');
        }

        acceptAllFromModal() {
            if (this.analyticsCookies) this.analyticsCookies.checked = true;
            if (this.marketingCookies) this.marketingCookies.checked = true;
            if (this.unclassifiedCookies) this.unclassifiedCookies.checked = true;
            
            this.saveSettings();
        }

        rejectAllFromModal() {
            if (this.analyticsCookies) this.analyticsCookies.checked = false;
            if (this.marketingCookies) this.marketingCookies.checked = false;
            if (this.unclassifiedCookies) this.unclassifiedCookies.checked = false;
            
            this.saveSettings();
        }

        saveSettings() {
            const preferences = {
                necessary: true,
                analytics: this.analyticsCookies?.checked || false,
                marketing: this.marketingCookies?.checked || false,
                unclassified: this.unclassifiedCookies?.checked || false
            };
            
            this.savePreferences(preferences);
            this.closeModal();
            this.banner.classList.remove('show');
        }

        openModal() {
            this.loadPreferences();
            this.modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            this.modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new CookieConsent());
    } else {
        new CookieConsent();
    }
})();