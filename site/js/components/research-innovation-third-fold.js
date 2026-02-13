(function () {
    function researchLabSliderSection() {
        gsap.registerPlugin(ScrollTrigger, SplitText,ScrollToPlugin);


         // Normalize scroll for mobile (fixes SVG breaking)
        if (ScrollTrigger.isTouch === 1) {
            ScrollTrigger.normalizeScroll(true);
        }
        // Split text animation for intro text
        const splitLetters = SplitText.create(document.querySelector(".research-lab-intro-text"));
        gsap.set(splitLetters.chars, { opacity: "0.3", y: 0 });
        gsap.timeline({
            scrollTrigger: {
                trigger: ".research-lab-intro-section",
                pin: true,
                start: "center center",
                end: "+=1500",
                scrub: 1,
                // markers: true,
            },
        })
            .to(splitLetters.chars, {
                opacity: "1",
                duration: 1,
                ease: "none",
                stagger: 1,
            })
            .to({}, { duration: 10 })
            .to(".research-lab-intro-text", {
                opacity: "0",
                scale: 1.2,
                duration: 50,
            });
        // Reverse scroll animation (for future sections)
        let reverseTrigger = gsap.utils.toArray(".research-lab-reverse-scroll");
        reverseTrigger.forEach((element) => {
            gsap.to(element, {
                yPercent: 30,
                scrollTrigger: {
                    trigger: element,
                    start: 0,
                    end: "+=100%",
                    scrub: true,
                    pin: true,
                    // markers: true,
                },
            });
        });
        // Liquify heading animation
        gsap.set(".research-lab-video-heading", { opacity: 0 });
        gsap.timeline({
            scrollTrigger: {
                trigger: ".research-lab-video-heading",
                start: "top bottom",
                end: "bottom 70%",
                scrub: true,
                // pin: true,
                // markers: true,
            },
        })
            .to(
                "#liquid",
                {
                    attr: { scale: 0 },
                },
                0
            )
            .to(
                ".research-lab-video-heading",
                {
                    opacity: 1,
                    y: 0,
                },
                0
            );
        // Skill bar + number animation
        const skills = document.querySelectorAll(".research-lab-skills .skill");
        skills.forEach((skill) => {
            const bar = skill.querySelector(".bar");
            const number = skill.querySelector(".number");
            const percent = skill.dataset.percent;
            gsap.timeline({
                scrollTrigger: {
                    trigger: skill,
                    start: "top 80%", // start when top of skill is near bottom of viewport
                    toggleActions: "play none none none",
                },
            })
                .to(bar, {
                    width: percent + "%",
                    duration: 1.5,
                    ease: "power2.out",
                })
                .to(
                    number,
                    {
                        innerText: percent,
                        duration: 1.5,
                        snap: { innerText: 1 },
                        ease: "power1.out",
                    },
                    "<"
                ); // "<" runs at the same time as bar animation
        });
        // ========= 1. Heading: "We're always ready for challenges." =========
        const firstHeading = document.querySelector(".research-lab-font-size");
        if (firstHeading) {
            const splitHeading = new SplitText(firstHeading, { type: "words" });
            gsap.set(splitHeading.words, { opacity: 0, y: 40 });
            gsap.timeline({
                scrollTrigger: {
                    trigger: firstHeading,
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
            }).to(splitHeading.words, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                stagger: 0.12, // slower stagger because words
            });
        }
        // ========= 2. Content Blocks: "Growth" and "Adapt" =========
        const contentBlocks = gsap.utils.toArray(".research-lab-content-width");
        contentBlocks.forEach((block) => {
            const heading = block.querySelector("h1");
            const paragraph = block.querySelector("p");
            if (heading && paragraph) {
                const splitHeading = new SplitText(heading, { type: "chars" });
                const splitParagraph = new SplitText(paragraph, { type: "words" });
                gsap.set(splitHeading.chars, { opacity: 0, y: 40 });
                gsap.set(splitParagraph.words, { opacity: 0, y: 20 });
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: block,
                        start: "top 85%",
                        toggleActions: "play none none none", // play once
                        // markers: true,
                    },
                });
                // Animate heading letters
                tl.to(splitHeading.chars, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.03,
                })
                    // Animate paragraph words slightly after
                    .to(
                        splitParagraph.words,
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            ease: "power2.out",
                            stagger: 0.01,
                        },
                        "-=0.3"
                    );
            }
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", researchLabSliderSection);
    } else {
        // init();
        researchLabSliderSection();
    }
})();