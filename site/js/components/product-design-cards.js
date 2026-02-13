gsap.registerPlugin(ScrollTrigger);

function initTilesStackTilt() {
    const stacks = document.querySelectorAll(".tiles-stack-wrapper");
    if (!stacks.length) return;

    stacks.forEach((stack) => {
        const items = stack.querySelectorAll(".tiles-stack-item");
        const title = stack.querySelector(".tiles-stack-title-container");
        const total = items.length;
        const depth = 0;
        const lift = 120;
        const maxRotation = 50;

        // Detect mobile vs desktop
        const isMobile = window.innerWidth <= 768;
        const scrollMultiplier = isMobile ? 1.3 : 0.7;

        gsap.set(stack, { perspective: 2200 });

        if (title) {
            ScrollTrigger.create({
                trigger: stack,
                start: "top top",
                end: "+=" + window.innerHeight * (total * scrollMultiplier * 1.25),
                pin: title,
                pinSpacing: false,
            });
        }

        // INITIAL POSITIONING
        items.forEach((item, i) => {
            gsap.set(item, {
                zIndex: total - i,
                transformOrigin: "center bottom",
                z: -i * depth,
                yPercent: i * 2,
                scale: 1,
                opacity: 1,
                rotateX: 0,
                force3D: true,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
            });
        });

        // BIDIRECTIONAL SMOOTH SCROLL ANIMATION
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: stack,
                start: "top top",
                end: "+=" + window.innerHeight * (total * scrollMultiplier),
                scrub: true,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            },
        });

        // Create symmetrical transitions for smooth forward AND reverse
        items.forEach((item, i) => {
            const position = i; // No overlap - use discrete positions

            if (i < total - 1) {
                const next = items[i + 1];

                // Exit current card
                tl.to(
                    item,
                    {
                        yPercent: -lift,
                        z: depth,
                        opacity: 0,
                        rotateX: maxRotation,
                        scale: 1,
                        ease: "power1.inOut", // Symmetrical easing for both directions
                        duration: 1,
                    },
                    position,
                );

                // Enter next card (simultaneous with exit)
                tl.fromTo(
                    next,
                    {
                        yPercent: (i + 1) * 2, // Start from stacked position
                        z: -(i + 1) * depth,
                        opacity: 1,
                        rotateX: 0,
                        scale: 1,
                    },
                    {
                        yPercent: 0,
                        z: 0,
                        opacity: 1,
                        rotateX: 0,
                        scale: 1,
                        ease: "power1.inOut", // Symmetrical easing
                        duration: 1,
                    },
                    position,
                );
            }
        });
    });
}

// Initialize
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTilesStackTilt);
} else {
    initTilesStackTilt();
}

// Debounced resize handler
let ourCapabilitiesResizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(ourCapabilitiesResizeTimer);
    ourCapabilitiesResizeTimer = setTimeout(() => {
        ScrollTrigger.getAll().forEach((st) => st.kill());
        initTilesStackTilt();
    }, 250);
});
