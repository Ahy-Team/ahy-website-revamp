// alisha 
(function () {
    function showToast(message, status = "success", duration = 2500) {
        const toast = document.getElementById("form-toast");

        if (!toast) return;

        toast.textContent = message;

        // reset previous color

        toast.className = "toast";

        // apply color + show

        toast.classList.add(status, "show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, duration);
    }
    /* ----------------------------------------
        Input Validation (Typing + Paste)
    ---------------------------------------- */
    function setupInputValidation() {
        const form = document.getElementById("contactForm");
        if (!form) return;

        const firstName = form.first_name;
        const lastName = form.last_name;
        const phone = form.phone;
        const email = form.email;

        // Names: letters + spaces only
        function cleanNameInput(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, "");
        }

        firstName.addEventListener("input", cleanNameInput);
        lastName.addEventListener("input", cleanNameInput);

        // Phone: numbers + optional leading +
        phone.addEventListener("input", (e) => {
            let value = e.target.value;

            // Keep only digits and leading +
            value = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

            // Limit digits to 10
            let digits = value.replace(/\D/g, "").slice(0, 10);

            // Re-add + if it exists at the start
            e.target.value = value.startsWith("+") ? "+" + digits : digits;
        });

        // Email: basic live validation
        email.addEventListener("input", (e) => {
            const value = e.target.value;
            // Regex for standard email with domain (supports .com, .co.in, etc.)
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

            if (!emailPattern.test(value)) {
                e.target.setCustomValidity("Enter a valid email with a domain, e.g., example@gmail.com");
            } else {
                e.target.setCustomValidity(""); // valid
            }
        });
    }
    let widgetId = null;
    let recaptchaInitialized = false;
    let recaptchaScriptLoaded = false;
    let recaptchaLoadPromise = null;
    /* ----------------------------------------
       Years of Experience
    ---------------------------------------- */
    function calculateYearsOfExperience() {
        const FOUNDING_YEAR = 2006;
        return new Date().getFullYear() - FOUNDING_YEAR;
    }
    function updateYearsOfExperience() {
        const yoeEl = document.querySelector(".stat-card:nth-child(2) h3");
        if (yoeEl) {
            yoeEl.textContent = calculateYearsOfExperience();
        }
    }
    /* ----------------------------------------
       Lazy Load reCAPTCHA Script
    ---------------------------------------- */
    function loadRecaptchaScript() {
        // Return existing promise if already loading
        if (recaptchaLoadPromise) {
            return recaptchaLoadPromise;
        }
        // Return resolved promise if already loaded
        if (recaptchaScriptLoaded && window.grecaptcha) {
            return Promise.resolve();
        }
        console.log("🔄 Loading reCAPTCHA script...");
        recaptchaLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                recaptchaScriptLoaded = true;
                console.log("✅ reCAPTCHA script loaded");
                resolve();
            };
            script.onerror = () => {
                recaptchaLoadPromise = null;
                reject(new Error("Failed to load reCAPTCHA script"));
            };
            document.head.appendChild(script);
        });
        return recaptchaLoadPromise;
    }
    /* ----------------------------------------
       Initialize reCAPTCHA Widget
    ---------------------------------------- */
    async function initRecaptcha() {
        if (recaptchaInitialized) {
            return;
        }
        const container = document.getElementById("recaptcha-container");
        if (!container) {
            console.warn("reCAPTCHA container not found");
            return;
        }

        if (container.hasChildNodes()) {
            console.log("reCAPTCHA already rendered, skipping");
            recaptchaInitialized = true;
            return;
        }
        // Wait for grecaptcha to be ready
        let attempts = 0;
        while (!window.grecaptcha && attempts < 50) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.grecaptcha) {
            console.error("grecaptcha not available after loading");
            return;
        }
        // Wait for grecaptcha.render to be available
        await new Promise((resolve) => {
            if (window.grecaptcha.render) {
                resolve();
            } else {
                window.grecaptcha.ready(() => resolve());
            }
        });
        try {
            widgetId = grecaptcha.render(container, {
                sitekey: "6Lc9yRwsAAAAAFEWIzqjKncxIjlLrA8kD09dR9F5",
                size: "invisible",
                callback: onRecaptchaSuccess,
            });
            recaptchaInitialized = true;
            console.log("✅ reCAPTCHA widget initialized");
        } catch (error) {
            console.error("Failed to initialize reCAPTCHA:", error);
        }
    }
    /* ----------------------------------------
       Form Submit Trigger (Lazy Load)
    ---------------------------------------- */
    async function onSubmitClick() {
        const currentScrollY = window.scrollY || window.pageYOffset;
        try {
            // Show loading state
            const submitBtn = document.querySelector('button[onclick="onSubmitClick()"]');
            const originalText = submitBtn ? submitBtn.textContent : "";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Loading security check...";
            }
            // Load reCAPTCHA script if not loaded
            if (!recaptchaScriptLoaded) {
                await loadRecaptchaScript();
            }
            // Initialize reCAPTCHA widget if not initialized
            if (!recaptchaInitialized || widgetId === null) {
                showToast("Security check still loading. Please wait a moment.");
                window.scrollTo(0, currentScrollY);
                showToast("Security check still loading. Please wait a moment.");

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }

                return;
            }
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
            // Execute reCAPTCHA
            window.scrollTo(0, currentScrollY);
            if (widgetId !== null && window.grecaptcha) {
                grecaptcha.execute(widgetId);
            } else {
                alert("Security check failed to initialize. Please try again.");
            }
        } catch (error) {
            console.error("Error during form submission:", error);
            window.scrollTo(0, currentScrollY);
            alert("An error occurred. Please refresh the page and try again.");
        }
    }
    window.onSubmitClick = onSubmitClick;
    /* ----------------------------------------
       reCAPTCHA Success Callback
    ---------------------------------------- */
    function onRecaptchaSuccess(token) {
        const currentScrollY = window.scrollY || window.pageYOffset;
        submitContactForm(token, currentScrollY);
    }
    /* ----------------------------------------
       Submit Form
    ---------------------------------------- */
    async function submitContactForm(recaptchaToken, savedScrollY) {
        const form = document.getElementById("contactForm");
        if (!form) return;
        const data = {
            first_name: form.first_name.value.trim(),
            last_name: form.last_name.value.trim(),
            phone: form.phone.value.trim(),
            email: form.email.value.trim(),
            company: form.company.value.trim(),
            message: form.message.value.trim(),
            consent: {
                status: form.consent.checked ? "Granted" : "Not Granted",
                text: form.consent.checked
                    ? "Consent granted to be contacted via email, WhatsApp, or phone"
                    : "Consent not granted to be contacted via email, WhatsApp, or phone",
                timestamp: new Date().toISOString(),
                source: "Contact Form",
            },
            recaptcha: recaptchaToken,
        };
        try {
            const response = await fetch("https://auto.yellowgap.com/webhook/contact-form-secure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (savedScrollY !== undefined) {
                window.scrollTo(0, savedScrollY);
            }
            if (response.ok) {
                showToast("Message sent successfully!", "success");

                // Store current consent state before reset
                const consentState = form.consent.checked;

                form.reset();

                // Restore consent checkbox to last submitted value
                if (form.consent) {
                    form.consent.checked = consentState;
                }

                if (widgetId !== null) {
                    grecaptcha.reset(widgetId);
                }
            }

            else {
                showToast(result?.error || "Failed to send message.", "error");
            }
        } catch (err) {
            console.error("Form submit error:", err);
            if (savedScrollY !== undefined) {
                window.scrollTo(0, savedScrollY);
            }
            showToast("Network error. Please try again later.", "warning");
        }
    }
    /* ----------------------------------------
       Trigger reCAPTCHA Load on User Interaction
    ---------------------------------------- */
    function setupLazyLoadTriggers() {
        const form = document.getElementById("contactForm");
        if (!form) {
            // Retry after a delay if form not yet loaded
            setTimeout(setupLazyLoadTriggers, 500);
            return;
        }
        // Load reCAPTCHA when user interacts with any form field
        const formInputs = form.querySelectorAll("input, textarea, select");

        function triggerRecaptchaLoad() {
            if (!recaptchaScriptLoaded) {
                console.log("🎯 User interacted with form, loading reCAPTCHA...");
                loadRecaptchaScript()
                    .then(() => {
                        initRecaptcha();
                    })
                    .catch((err) => {
                        console.error("Failed to load reCAPTCHA:", err);
                    });
            }
        }
        formInputs.forEach((input) => {
            input.addEventListener("focus", triggerRecaptchaLoad, { once: true });
            input.addEventListener("input", triggerRecaptchaLoad, { once: true });
        });
        // Also trigger on form hover (for desktop users)
        form.addEventListener("mouseenter", triggerRecaptchaLoad, { once: true });
    }
    /* ----------------------------------------
       Button Text Animation (Run Once)
    ---------------------------------------- */
    function animateButtons() {
        document.querySelectorAll(".btn-anim:not([data-animated])").forEach((btn) => {
            btn.setAttribute("data-animated", "true");
            const text = btn.textContent.trim();
            const spans = text
                .split("")
                .map((char) => (char === " " ? "&nbsp;" : `<span>${char}</span>`))
                .join("");
            btn.innerHTML = `<div>${spans}</div>`;
        });
    }
    /* ----------------------------------------
       Init When Component Loaded
    ---------------------------------------- */
    function init() {
        updateYearsOfExperience();
        animateButtons();
        setupLazyLoadTriggers();
        setupInputValidation();
        console.log("✅ Lazy reCAPTCHA initialized - will load on form interaction");
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
