// TEAM INTRO SPLIT + SCROLL ANIMATION
(function () {
    function initTeamIntroScrollAnimation() {
        gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin);

        const introText = document.querySelector(".team-intro-text");
        if (!introText) return;

        const splitLetters = SplitText.create(introText);
        gsap.set(splitLetters.chars, { opacity: "0.3" });

        gsap.timeline({
            scrollTrigger: {
                trigger: ".team-intro-section",
                pin: true,
                start: "center center",
                end: "+=1500",
                scrub: 1,
            },
        })
            .to(splitLetters.chars, {
                opacity: "1",
                duration: 1,
                ease: "none",
                stagger: 1,
            })
            .to({}, { duration: 10 })
            .to(".team-intro-text", {
                opacity: 0,
                scale: 1.2,
                duration: 50,
            });
    }

    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", initTeamIntroScrollAnimation)
        : initTeamIntroScrollAnimation();
})();

