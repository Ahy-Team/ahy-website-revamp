(function () {

    async function loadHeroContent() {
        const pageKey = document.body.getAttribute("data-page") || "hyva";
        const jsonPath = "js/components/hero/hero-section.json";

        try {
            const res = await fetch(jsonPath, { cache: "no-cache" });
            if (!res.ok) throw new Error("Hero JSON load error: " + res.status);
            const data = await res.json();
            return data[pageKey] || data["hyva"];
        } catch (err) {
            console.warn(err);
            return null;
        }
    }

    function injectHeroContent(content) {
        if (!content) return;

        const titleEl = document.getElementById("service-hero-text");
        const subEl = document.getElementById("hero-subtext");

        if (titleEl) titleEl.innerHTML = content.title || "";
        if (subEl) subEl.textContent = content.subtitle || "";
    }

    function hideLoader() {
        const loader = document.getElementById("hero-loader");
        const heroSection = document.querySelector(".line-split-section");

        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none";
            }, 400);
        }

        if (heroSection) {
            heroSection.style.opacity = "1";
        }
    }

    function runHeroAnimation() {
        gsap.registerPlugin(SplitText, ScrollTrigger);

        function splitHeroText() {
            const heroText = document.getElementById("service-hero-text");
            if (!heroText) return;

            heroText.offsetHeight;

            let words = heroText.innerHTML
                .replace(/<br>/g, " <br> ")
                .split(" ")
                .filter(Boolean);

            heroText.innerHTML = "";

            words.forEach(word => {
                if (word === "<br>") {
                    heroText.appendChild(document.createElement("br"));
                    return;
                }

                const wordWrapper = document.createElement("span");
                wordWrapper.className = "word";
                wordWrapper.style.display = "inline-block";

                [...word].forEach(letter => {
                    const span = document.createElement("span");
                    span.className = "letter";
                    span.textContent = letter;
                    wordWrapper.appendChild(span);
                });

                heroText.appendChild(wordWrapper);
                heroText.appendChild(document.createTextNode(" "));
            });

            heroText.offsetHeight;
        }

        function animateHeroText() {
            const letters = document.querySelectorAll(".service-hero-title .letter");
            if (!letters.length) return;

            gsap.set(letters, {
                opacity: 0,
                y: 80,
                willChange: "transform, opacity"
            });

            gsap.to(letters, {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.03,
                clearProps: "willChange",
                delay: 0.1
            });
        }

        function animateSubText() {
            const el = document.querySelector(".line-split-text-hero");
            if (!el) return;

            const split = new SplitText(el, {
                type: "lines",
                linesClass: "line-child"
            });

            gsap.set(split.lines, {
                opacity: 0,
                rotationX: -90,
                transformOrigin: "50% 50%",
                transformPerspective: 500
            });

            gsap.to(split.lines, {
                rotationX: 0,
                opacity: 1,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.18,
                delay: 0.4
            });
        }

        splitHeroText();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                animateHeroText();
                animateSubText();
            });
        });
    }

    async function init() {
        const loader = document.getElementById("hero-loader");
        const heroSection = document.querySelector(".line-split-section");

        if (loader) loader.style.display = "block";
        if (heroSection) heroSection.style.opacity = "0";

        try {
            const content = await loadHeroContent();
            injectHeroContent(content);

            hideLoader();
            runHeroAnimation();

        } catch (err) {
            console.error("Hero init error:", err);
            hideLoader();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
