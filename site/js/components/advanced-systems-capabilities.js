(function () {
    function initAdvCapabilities() {
        const section = document.querySelector(".adv-capabilities");
        if (!section) return;

        const cards = section.querySelectorAll(".adv-card");
        const hasGsap = typeof gsap !== "undefined";
        let openIndex = null;

        function openCard(index) {
            if (openIndex !== null && openIndex !== index) closeCard(openIndex);
            openIndex = index;

            const card = cards[index];
            const content = card.querySelector(".adv-card-content");
            const text = card.querySelector(".adv-card-text");
            const caret = card.querySelector(".adv-icon");

            if (hasGsap) {
                gsap.timeline()
                    .to(content, { height: content.scrollHeight, opacity: 1, duration: 0.25, ease: "power2.out" })
                    .to(text, { opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.05");
                gsap.to(caret, { rotate: 180, duration: 0.15 });
            } else {
                card.classList.add("is-open");
            }
        }

        function closeCard(index) {
            const card = cards[index];
            const content = card.querySelector(".adv-card-content");
            const text = card.querySelector(".adv-card-text");
            const caret = card.querySelector(".adv-icon");

            if (hasGsap) {
                gsap.timeline()
                    .to(text, { opacity: 0, duration: 0.1 })
                    .to(content, { height: 0, opacity: 0, duration: 0.2, ease: "power2.in" });
                gsap.to(caret, { rotate: 0, duration: 0.15, color: "#efefd5" });
            } else {
                card.classList.remove("is-open");
            }
            if (openIndex === index) openIndex = null;
        }

        function toggleCard(index) {
            openIndex === index ? closeCard(index) : openCard(index);
        }

        cards.forEach((card) => {
            const index = Number(card.dataset.index);

            card.addEventListener("mouseenter", () => {
                if (window.innerWidth > 768) openCard(index);
            });
            card.addEventListener("mouseleave", () => {
                if (window.innerWidth > 768) closeCard(index);
            });
            card.addEventListener("click", () => {
                if (window.innerWidth <= 768) toggleCard(index);
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAdvCapabilities);
    } else {
        initAdvCapabilities();
    }
})();
