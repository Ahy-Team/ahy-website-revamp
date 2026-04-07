// Step Form with n8n Integration
(function () {
    let currentStep = 1;
    const totalSteps = 5;
    let formData = {};

    // reCAPTCHA variables
    let widgetId = null;
    let recaptchaInitialized = false;
    let recaptchaScriptLoaded = false;
    let recaptchaLoadPromise = null;

    /* ----------------------------------------
        Toast Notification
    ---------------------------------------- */
    function showToast(message, status = "success", duration = 2500) {
        const toast = document.getElementById("form-toast");
        if (!toast) return;

        toast.textContent = message;
        toast.className = "toast";
        toast.classList.add(status, "show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, duration);
    }

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
        Progress Bar Update
    ---------------------------------------- */
    function updateProgress() {
        const progressFill = document.getElementById("progressFill");
        const currentStepEl = document.getElementById("currentStep");

        if (progressFill && currentStepEl) {
            const percentage = (currentStep / totalSteps) * 100;
            progressFill.style.width = percentage + "%";
            currentStepEl.textContent = currentStep;
        }
    }

    /* ----------------------------------------
        Show Step
    ---------------------------------------- */
    function showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll(".form-step").forEach((step) => {
            step.classList.remove("active");
        });

        // Show current step
        const currentStepEl = document.querySelector(`[data-step="${stepNumber}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add("active");
        }

        currentStep = stepNumber;
        updateProgress();

        // Scroll to top of form smoothly
        // const contactForm = document.querySelector(".contact-form");
        // if (contactForm) {
        //     contactForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // }
    }

    /* ----------------------------------------
        Step 1: Name Input
    ---------------------------------------- */
    function initStep1() {
        const nameInput = document.getElementById("full_name");
        const nextBtn = document.querySelector('[data-step="1"] .btn-next');

        if (!nameInput || !nextBtn) return;

        // Clean input - letters and spaces only
        nameInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, "");

            // Enable/disable next button
            nextBtn.disabled = e.target.value.trim().length < 2;
        });

        // Next button click
        nextBtn.addEventListener("click", () => {
            const name = nameInput.value.trim();
            if (name.length >= 2) {
                formData.full_name = name;

                // Update name in step 2
                const nameDisplay = document.getElementById("nameDisplay");
                if (nameDisplay) {
                    nameDisplay.textContent = name;
                }

                showStep(2);
            }
        });

        // Allow Enter key
        nameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !nextBtn.disabled) {
                e.preventDefault();
                nextBtn.click();
            }
        });
    }

    /* ----------------------------------------
        Step 2: Email Input
    ---------------------------------------- */
    function initStep2() {
        const emailInput = document.getElementById("email");
        const nextBtn = document.querySelector('[data-step="2"] .btn-next');
        const backBtn = document.querySelector('[data-step="2"] .btn-back');

        if (!emailInput || !nextBtn || !backBtn) return;

        // Validate email
        emailInput.addEventListener("input", (e) => {
            const value = e.target.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

            if (emailPattern.test(value)) {
                nextBtn.disabled = false;
                emailInput.setCustomValidity("");
            } else {
                nextBtn.disabled = true;
                if (value.length > 0) {
                    emailInput.setCustomValidity("Enter a valid email");
                }
            }
        });

        // Next button
        nextBtn.addEventListener("click", () => {
            const email = emailInput.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

            if (emailPattern.test(email)) {
                formData.email = email;
                showStep(3);
            }
        });

        // Back button
        backBtn.addEventListener("click", () => {
            showStep(1);
        });

        // Allow Enter key
        emailInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !nextBtn.disabled) {
                e.preventDefault();
                nextBtn.click();
            }
        });
    }

    /* ----------------------------------------
        Step 3: Help With (Multiple Options)
    ---------------------------------------- */
    function initStep3() {
        const optionBtns = document.querySelectorAll('[data-step="3"] .option-btn');
        const nextBtn = document.querySelector('[data-step="3"] .btn-next');
        const backBtn = document.querySelector('[data-step="3"] .btn-back');
        const hiddenInput = document.getElementById("help_with");

        if (!optionBtns.length || !nextBtn || !backBtn || !hiddenInput) return;

        let selectedOptions = [];

        optionBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.getAttribute("data-value");

                if (btn.classList.contains("selected")) {
                    // Deselect
                    btn.classList.remove("selected");
                    selectedOptions = selectedOptions.filter((opt) => opt !== value);
                } else {
                    // Select
                    btn.classList.add("selected");
                    selectedOptions.push(value);
                }

                // Enable next if at least one selected
                nextBtn.disabled = selectedOptions.length === 0;
                hiddenInput.value = selectedOptions.join(", ");
            });
        });

        // Next button
        nextBtn.addEventListener("click", () => {
            if (selectedOptions.length > 0) {
                formData.help_with = selectedOptions.join(", ");
                showStep(4);
            }
        });

        // Back button
        backBtn.addEventListener("click", () => {
            showStep(2);
        });
    }

    /* ----------------------------------------
        Step 4: Budget (Yes/No with Conditional Range)
    ---------------------------------------- */
    function initStep4() {
        const ynBtns = document.querySelectorAll('[data-step="4"] .yn-btn');
        const nextBtn = document.querySelector('[data-step="4"] .btn-next');
        const backBtn = document.querySelector('[data-step="4"] .btn-back');
        const budgetRangeContainer = document.querySelector(".budget-range-container");
        const budgetSelect = document.getElementById("budget_range");
        const hiddenInput = document.getElementById("has_budget");

        if (!ynBtns.length || !nextBtn || !backBtn || !budgetRangeContainer || !budgetSelect || !hiddenInput) return;

        let hasBudget = null;

        ynBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.getAttribute("data-value");

                // Remove selected from all
                ynBtns.forEach((b) => b.classList.remove("selected"));

                // Add selected to clicked
                btn.classList.add("selected");
                hasBudget = value;
                hiddenInput.value = value;

                // Show/hide budget range
                if (value === "yes") {
                    budgetRangeContainer.style.display = "block";
                    budgetSelect.required = true;
                    nextBtn.disabled = !budgetSelect.value;
                } else {
                    budgetRangeContainer.style.display = "none";
                    budgetSelect.required = false;
                    budgetSelect.value = "";
                    nextBtn.disabled = false;
                }
            });
        });

        // Budget select change
        budgetSelect.addEventListener("change", () => {
            if (hasBudget === "yes") {
                nextBtn.disabled = !budgetSelect.value;
            }
        });

        // Next button
        nextBtn.addEventListener("click", () => {
            if (hasBudget === "yes") {
                if (budgetSelect.value) {
                    formData.has_budget = "Yes";
                    formData.budget_range = budgetSelect.value;

                    // Lazy load reCAPTCHA when reaching final step
                    if (!recaptchaScriptLoaded) {
                        loadRecaptchaScript().then(() => {
                            initRecaptcha();
                        });
                    }

                    showStep(5);
                }
            } else if (hasBudget === "no") {
                formData.has_budget = "No";
                formData.budget_range = "Not specified";

                // Lazy load reCAPTCHA when reaching final step
                if (!recaptchaScriptLoaded) {
                    loadRecaptchaScript().then(() => {
                        initRecaptcha();
                    });
                }

                showStep(5);
            }
        });

        // Back button
        backBtn.addEventListener("click", () => {
            showStep(3);
        });
    }

    /* ----------------------------------------
        Step 5: Message & Submit
    ---------------------------------------- */
    function initStep5() {
        const messageInput = document.getElementById("message");
        const consentCheckbox = document.getElementById("consent");
        const submitBtn = document.querySelector('[data-step="5"] .btn-submit');
        const backBtn = document.querySelector('[data-step="5"] .btn-back');

        if (!messageInput || !consentCheckbox || !submitBtn || !backBtn) return;

        // Back button
        backBtn.addEventListener("click", () => {
            showStep(4);
        });

        // Submit button
        submitBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            // Collect final data
            formData.message = messageInput.value.trim() || "No message provided";
            formData.consent = {
                status: consentCheckbox.checked ? "Granted" : "Not Granted",
                text: consentCheckbox.checked ? "Consent granted to be contacted via email, WhatsApp, or phone" : "Consent not granted to be contacted via email, WhatsApp, or phone",
                timestamp: new Date().toISOString(),
                source: "Step Contact Form",
            };

            // Check if reCAPTCHA is ready
            if (!recaptchaInitialized || widgetId === null) {
                showToast("Security check still loading. Please wait...", "warning");

                // Try to initialize if not done
                if (!recaptchaScriptLoaded) {
                    await loadRecaptchaScript();
                }
                if (!recaptchaInitialized) {
                    await initRecaptcha();
                }

                // Try again after initialization
                setTimeout(() => {
                    if (recaptchaInitialized && widgetId !== null) {
                        grecaptcha.execute(widgetId);
                    } else {
                        showToast("Security check failed. Please refresh and try again.", "error");
                    }
                }, 1000);
                return;
            }

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";

            // Execute reCAPTCHA
            grecaptcha.execute(widgetId);
        });
    }

    /* ----------------------------------------
        Lazy Load reCAPTCHA Script
    ---------------------------------------- */
    function loadRecaptchaScript() {
        if (recaptchaLoadPromise) {
            return recaptchaLoadPromise;
        }
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
            console.log("reCAPTCHA already rendered");
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

        // Wait for grecaptcha.render
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
        reCAPTCHA Success Callback
    ---------------------------------------- */
    function onRecaptchaSuccess(token) {
        formData.recaptcha = token;
        submitToN8N();
    }

    /* ----------------------------------------
        Submit to n8n Webhook
    ---------------------------------------- */
    async function submitToN8N() {
        const submitBtn = document.querySelector('[data-step="5"] .btn-submit');

        try {
            const response = await fetch("https://auto.yellowgap.com/webhook/e968bdeb-2428-4d03-a8cf-98c2577ebea6", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                showToast("Message sent successfully! We'll be in touch soon.", "success", 3500);

                // Reset form after 2 seconds
                setTimeout(() => {
                    resetForm();
                }, 2000);
            } else {
                showToast(result?.error || "Failed to send message. Please try again.", "error");

                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit";
                }

                // Reset reCAPTCHA
                if (widgetId !== null) {
                    grecaptcha.reset(widgetId);
                }
            }
        } catch (err) {
            console.error("Form submit error:", err);
            showToast("Network error. Please check your connection and try again.", "error");

            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit";
            }

            // Reset reCAPTCHA
            if (widgetId !== null) {
                grecaptcha.reset(widgetId);
            }
        }
    }

    /* ----------------------------------------
        Reset Form
    ---------------------------------------- */
    function resetForm() {
        // Clear form data
        formData = {};

        // Reset all inputs
        const form = document.getElementById("contactForm");
        if (form) {
            form.reset();
        }

        // Clear selections
        document.querySelectorAll(".option-btn.selected, .yn-btn.selected").forEach((btn) => {
            btn.classList.remove("selected");
        });

        // Hide budget range
        const budgetRangeContainer = document.querySelector(".budget-range-container");
        if (budgetRangeContainer) {
            budgetRangeContainer.style.display = "none";
        }

        // Reset buttons
        document.querySelectorAll(".btn-next").forEach((btn) => {
            btn.disabled = true;
        });

        // Enable first step's next button if name exists
        const firstNextBtn = document.querySelector('[data-step="1"] .btn-next');
        const nameInput = document.getElementById("full_name");
        if (firstNextBtn && nameInput) {
            firstNextBtn.disabled = nameInput.value.trim().length < 2;
        }

        // Reset submit button
        const submitBtn = document.querySelector('[data-step="5"] .btn-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit";
        }

        // Reset reCAPTCHA
        if (widgetId !== null) {
            grecaptcha.reset(widgetId);
        }

        // Go back to step 1
        showStep(1);
    }

    /* ----------------------------------------
        Button Text Animation
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
        Initialize All Steps
    ---------------------------------------- */
    function init() {
        updateYearsOfExperience();
        animateButtons();

        // Set total steps
        const totalStepsEl = document.getElementById("totalSteps");
        if (totalStepsEl) {
            totalStepsEl.textContent = totalSteps;
        }

        // Initialize all steps
        initStep1();
        initStep2();
        initStep3();
        initStep4();
        initStep5();

        // Show first step
        showStep(1);

        console.log("✅ Step form initialized");
    }

    // Initialize when ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
