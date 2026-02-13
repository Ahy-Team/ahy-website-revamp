(function () {
    function initExpandableSection() {
        document.querySelectorAll(".modal-overlay").forEach(modal => {
            document.body.appendChild(modal);
        });

        const cards = document.querySelectorAll(".card-expand");
        const modals = document.querySelectorAll(".modal-overlay");
        const modalCloseButtons = document.querySelectorAll(".modal-close");

        let openIndex = null;

        cards.forEach((card) => {
            const index = card.dataset.index;
            const caret = card.querySelector(".icon");
            const btn = card.querySelector(".modal-btn");

            card.addEventListener("mouseenter", () => {
                if (window.innerWidth > 768) openCard(index);
            });
            card.addEventListener("mouseleave", () => {
                if (window.innerWidth > 768) closeCard(index);
            });
            card.addEventListener("click", () => {
                if (window.innerWidth <= 768) toggleCard(index);
            });
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                openModal(index);
            });
        });

        function toggleCard(index) {
            openIndex === index ? closeCard(index) : openCard(index);
        }

        function openCard(index) {
            if (openIndex !== null && openIndex !== index) {
                closeCard(openIndex);
            }
            openIndex = index;
            const card = cards[index];
            const content = card.querySelector(".expand-card-content");
            const text = card.querySelector(".text-content");
            const caret = card.querySelector(".icon");

            gsap.timeline()
                .to(content, { height: content.scrollHeight, opacity: 1, duration: 0.2, ease: "power2.out" })
                .to(text, { opacity: 1, duration: 0.3, ease: "power2.out" }, "+=0.2");

            gsap.to(caret, { rotate: 180, duration: 0.1 });
        }

        function closeCard(index) {
            const card = cards[index];
            const content = card.querySelector(".expand-card-content");
            const text = card.querySelector(".text-content");
            const caret = card.querySelector(".icon");

            gsap.timeline()
                .to(text, { opacity: 0, duration: 0.1 })
                .to(content, { height: 0, opacity: 0, duration: 0.2, ease: "power2.in" });

            gsap.to(caret, { rotate: 0, duration: 0.1, color: "#efefd5" });
            openIndex = null;
        }

        // ✅ Modal functionality
        function openModal(index) {
            const modalOverlay = document.querySelector(`.modal-overlay[data-index="${index}"]`);
            const modalContent = modalOverlay.querySelector(".modal-content");

            // STOP ScrollSmoother scroll
            if (window.ScrollSmoother && ScrollSmoother.get()) {
                ScrollSmoother.get().paused(true);
            }

            document.body.classList.add("no-scroll");

            gsap.set(modalOverlay, { display: "flex", opacity: 0, scaleX: 0, scaleY: 0.01 });
            gsap.set(modalContent, { scale: 0.7, opacity: 0, y: 50 });

            gsap.timeline()
                .to(modalOverlay, { opacity: 1, scaleX: 1, duration: 0.4, ease: "power2.out" })
                .to(modalOverlay, { scaleY: 1, duration: 0.3, ease: "power2.out" }, "-=0.1")
                .to(modalContent, { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.1");
        }

        function closeModal(index) {
            const modalOverlay = document.querySelector(`.modal-overlay[data-index="${index}"]`);
            const modalContent = modalOverlay.querySelector(".modal-content");

            gsap.timeline({
                onComplete: () => {
                    modalOverlay.style.display = "none";
                    document.body.classList.remove("no-scroll");

                    // RESUME ScrollSmoother scroll
                    if (window.ScrollSmoother && ScrollSmoother.get()) {
                        ScrollSmoother.get().paused(false);
                    }
                },
            })
                .to(modalContent, { scale: 0.8, opacity: 0, y: -30, duration: 0.5, ease: "power2.in" })
                .to(modalOverlay, { scaleY: 0.01, duration: 0.4, ease: "power2.in" }, "-=0.1")
                .to(modalOverlay, { scaleX: 0, opacity: 0, duration: 0.5, ease: "power2.in" }, "-=0.1");
        }


        // Close on overlay or button click
        modals.forEach((modal, index) => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) closeModal(index);
            });
        });
        modalCloseButtons.forEach((btn, index) => btn.addEventListener("click", () => closeModal(index)));

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initExpandableSection);
    } else {
        initExpandableSection();
    }
})();