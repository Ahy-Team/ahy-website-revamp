(function () {
    function initPhilosophy() {
        gsap.registerPlugin(ScrollTrigger, SplitText);

        gsap.set(".ahy-techstrip-image-motion", {
            transform: "rotateX(90deg)",
        });

        gsap.to(".ahy-techstrip-image-motion", {
            transform: "rotateX(0deg)",
            scrollTrigger: {
                trigger: ".ahy-techstrip-section2",
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            },
        });

        gsap.fromTo(
            ".ahy-techstrip-title",
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".ahy-techstrip-section3",
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                },
            }
        );

        gsap.fromTo(
            ".ahy-techstrip-subtitle",
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: 0.3,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".ahy-techstrip-section3",
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                },
            }
        );

        const textLines = new SplitText(".ahy-techstrip-text", {
            type: "lines",
            linesClass: "lineChild",
            tag: "span",
        });

        gsap.fromTo(
            ".ahy-techstrip-text",
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".ahy-techstrip-text-content",
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                },
            }
        );

        gsap.fromTo(
            ".ahy-techstrip-feature",
            { opacity: 0, y: 50, scale: 0.9 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                stagger: 0.2,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".ahy-techstrip-features",
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                },
            }
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPhilosophy);
    } else {
        initPhilosophy();
    }
})();
