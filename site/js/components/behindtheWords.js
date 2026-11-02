(function () {
    function initHeader() {
        // gsap.registerPlugin(ScrollTrigger);

        const pinText = document.querySelector(".BTwords-pin-text");
        const secondLastImage = document.querySelector(
            ".BTwords-image:nth-last-child(2)"
        );
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {

        // Pin the text
        ScrollTrigger.create({
            trigger: pinText,
            start: "top center-=130",
            endTrigger: secondLastImage,
            end: "bottom center",
            pin: true,
            pinSpacing: false,
        });

        // Fade out the pinned text as we scroll
        gsap.to(pinText, {
            opacity: 0,
            scrollTrigger: {
                trigger: pinText,
                start: "top center-=130",
                endTrigger: secondLastImage,
                end: "bottom center",
                scrub: true, // smooth fading
            },
        });

        // Animate images behind pinned text
        gsap.utils.toArray(".BTwords-image").forEach((img, i, arr) => {
            if (i < arr.length - 1) {
                gsap.to(img, {
                    y: -100,
                    scrollTrigger: {
                        trigger: img,
                        start: "top center",
                        end: "bottom center",
                        scrub: true,
                    },
                });
            }
        });
    }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHeader);
    } else {
        initHeader();
    }
})();
