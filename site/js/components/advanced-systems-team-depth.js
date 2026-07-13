/* Advanced Systems — Team Depth
   Reuses the timeline-omnicommerce scroll animation (progress line, pinned
   labels, content fade-in), scoped to this section and wrapped in an IIFE.
   Waits for GSAP + ScrollTrigger before initialising. */
(function () {
    function ready() {
        return typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
    }

    function initTimelineTeamDepth() {
        gsap.registerPlugin(ScrollTrigger);

        const root = document.querySelector(".adv-team-timeline");
        if (!root) return;

        const container = root.querySelector(".timelineAbout-container");
        const progressLine = root.querySelector("#timelineAboutProgressLine");
        const sections = Array.from(root.querySelectorAll(".timelineAbout-section"));

        if (!container || !progressLine) {
            console.warn("Team Depth timeline: required elements not found");
            return;
        }

        // 1. Synced progress line
        gsap.to(progressLine, {
            height: "100%",
            ease: "none",
            scrollTrigger: {
                trigger: container,
                start: "top 50%",
                end: "bottom 50%",
                scrub: true,
            },
        });

        // 2. Positioning & responsiveness
        function positionProgressLine() {
            const firstSection = root.querySelector(".timelineAbout-section");
            if (!firstSection) return;

            const lineColumn = firstSection.querySelector(".timelineAbout-line-column");
            if (!lineColumn) return;

            const containerRect = container.getBoundingClientRect();
            const colRect = lineColumn.getBoundingClientRect();

            const centerX = colRect.left + colRect.width / 2;
            const leftInside = Math.round(centerX - containerRect.left);

            progressLine.style.left = leftInside + "px";

            const staticTrack = root.querySelector("#timelineAboutStaticTrack");
            if (staticTrack) {
                staticTrack.style.left = leftInside + "px";
            }

            root.querySelectorAll(".timelineAbout-year-container").forEach((yc) => {
                const dot = yc.querySelector(".timelineAbout-year-dot");
                if (!dot) return;

                const ycRect = yc.getBoundingClientRect();
                const dotRect = dot.getBoundingClientRect();
                const targetPageX = containerRect.left + leftInside;

                if (window.innerWidth <= 768) {
                    yc.style.transform = "";
                    const leftWithin = Math.round(targetPageX - ycRect.left - dotRect.width / 2);
                    dot.style.left = leftWithin + "px";
                    dot.style.right = "auto";
                } else {
                    dot.style.left = "";
                    dot.style.right = "";
                    const dotCenterRel = dotRect.left - containerRect.left + dotRect.width / 2;
                    const shift = leftInside - Math.round(dotCenterRel);
                    yc.style.transform = `translateX(${shift}px)`;
                }
            });
        }

        function getDotOffset(section) {
            const dot = section.querySelector(".timelineAbout-year-dot");
            if (!dot) return 0;
            const secRect = section.getBoundingClientRect();
            const dotRect = dot.getBoundingClientRect();
            return Math.round(dotRect.top - secRect.top + dotRect.height / 2);
        }

        positionProgressLine();
        ScrollTrigger.addEventListener("refresh", positionProgressLine);

        // 3. Synced active states
        let activeTriggers = [];
        function createActiveTriggers() {
            activeTriggers.forEach((t) => t.kill());
            activeTriggers = [];

            sections.forEach((section) => {
                const yearContainer = section.querySelector(".timelineAbout-year-container");
                const offset = getDotOffset(section);

                const trig = ScrollTrigger.create({
                    trigger: section,
                    start: `top+=${offset}px 50%`,
                    end: "bottom 50%",
                    toggleClass: { targets: yearContainer, className: "is-active" },
                    fastScrollEnd: true,
                });
                activeTriggers.push(trig);
            });
        }
        createActiveTriggers();

        // 4. Pinning (desktop only)
        let pinTriggers = [];
        function createPins() {
            if (window.innerWidth <= 768) return;

            sections.forEach((section) => {
                const yearContainer = section.querySelector(".timelineAbout-year-container");
                const offset = getDotOffset(section);

                const trig = ScrollTrigger.create({
                    trigger: section,
                    start: `top+=${offset}px 50%`,
                    end: "bottom 50%",
                    pin: yearContainer,
                    pinSpacing: false,
                    scrub: true,
                    anticipatePin: 1,
                });
                pinTriggers.push(trig);
            });
        }
        function killPins() {
            pinTriggers.forEach((t) => t.kill());
            pinTriggers = [];
        }
        createPins();

        // 5. Content fade-in
        sections.forEach((section) => {
            const content = section.querySelector(".timelineAbout-content");
            if (content) {
                gsap.set(content, { opacity: 0, y: 30 });
                gsap.to(content, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 75%",
                        end: "top 25%",
                        toggleActions: "play none none none",
                    },
                });
            }
        });

        // Resize handler
        window.addEventListener("resize", () => {
            positionProgressLine();
            killPins();
            if (window.innerWidth > 768) createPins();
            createActiveTriggers();
            ScrollTrigger.refresh();
        });

        ScrollTrigger.refresh();
    }

    let tries = 0;
    (function waitAndInit() {
        if (ready()) {
            initTimelineTeamDepth();
        } else if (tries++ < 200) {
            requestAnimationFrame(waitAndInit);
        }
    })();
})();
