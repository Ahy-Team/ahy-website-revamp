(function () {
    function sectionReveal() {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
            // DESKTOP ONLY
            if (ScrollTrigger.isTouch === 1) {
                ScrollTrigger.normalizeScroll(true);
            }

            ScrollTrigger.config({ anticipatePin: 1 });

            let isScrolling = false;

            function smoothTo(y) {
                isScrolling = true;
                gsap.to(window, {
                    duration: 0.45,
                    ease: "power2.out",
                    scrollTo: { y, autoKill: true },
                    onComplete: () => (isScrolling = false),
                });
            }

            if (!ScrollTrigger.isTouch) {
                window.addEventListener(
                    "wheel",
                    (e) => {
                        if (isScrolling) e.preventDefault();
                    },
                    { passive: false }
                );
            }

            /* PANEL REVEAL ANIMATION - DESKTOP */
            const sectionReveal = gsap.timeline();
            sectionReveal.from(".gradient-orange", { xPercent: -100 }).from(".gradient-purple", { xPercent: 100 }).from(".gradient-blue", { yPercent: -100 });

            ScrollTrigger.create({
                animation: sectionReveal,
                trigger: "#panel-container",
                start: "top top",
                end: "500%",
                scrub: true,
                pin: true,
                anticipatePin: 1,
            });
        } else {
            /* MOBILE - Wait until section is in view */
            gsap.set(".gradient-orange", { xPercent: -100 });
            gsap.set(".gradient-purple", { xPercent: 100 });
            gsap.set(".gradient-blue", { yPercent: -100 });

            const sectionReveal = gsap.timeline();
            sectionReveal.to(".gradient-orange", { xPercent: 0 }).to(".gradient-purple", { xPercent: 0 }).to(".gradient-blue", { yPercent: 0 });

            ScrollTrigger.create({
                animation: sectionReveal,
                trigger: "#panel-container",
                start: "top top",
                end: "200%",
                scrub: true,
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", sectionReveal);
    } else {
        sectionReveal();
    }
})();
