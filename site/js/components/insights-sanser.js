(function () {
    function initHeader() {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

        const data = [
            {
                title: "Capture",
                info: "Document real project learnings and decisions, ensuring insights reflect practical experience.",
                svg: `<svg class="sanser-svg-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                        <circle class="sanser-svg-fill" cx="32" cy="32" r="30" stroke-width="2"/>
                        <path class="sanser-svg-fill" d="M16 24 L48 24 L48 40 L16 40 Z"/>
                        <line class="sanser-svg-fill" x1="16" y1="32" x2="48" y2="32" stroke-width="2"/>
                    </svg>`,
            },
            {
                title: "Reflect",
                info: "Analyze patterns, learn from mistakes, and understand system and design interactions.",
                svg: `<svg class="sanser-svg-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                        <path class="sanser-svg-fill" d="M32 4 A28 28 0 1 1 31.9 4 Z"/>
                        <line class="sanser-svg-fill" x1="32" y1="32" x2="32" y2="16" stroke-width="2"/>
                        <line class="sanser-svg-fill" x1="32" y1="32" x2="44" y2="32" stroke-width="2"/>
                    </svg>`,
            },
            {
                title: "Share",
                info: "Share insights to help teams make informed decisions and avoid repeated pitfalls.",
                svg: `<svg class="sanser-svg-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                        <path class="sanser-svg-fill" d="M12 44 L52 44 L32 20 Z"/>
                        <circle class="sanser-svg-fill" cx="32" cy="48" r="4"/>
                        <line class="sanser-svg-fill" x1="32" y1="48" x2="32" y2="40" stroke-width="2"/>
                    </svg>`,
            }
        ];

        document.querySelectorAll(".sanser-total-number").forEach((el) => (el.textContent = data.length));

        function updateContent(front, back, step, fillProgress) {
            document.querySelector(".sanser-front-title").textContent = front?.title || "";
            document.querySelector(".sanser-front-info").textContent = front?.info || "";
            document.querySelector(".sanser-back-title").textContent = back?.title || "";
            document.querySelector(".sanser-back-info").textContent = back?.info || "";
            document.querySelector(".sanser-front-svg").innerHTML = front?.svg || "";
            document.querySelector(".sanser-back-svg").innerHTML = back?.svg || "";

            const fillColor = `rgba(236, 25, 101, ${fillProgress})`;
            const strokeColor = `rgba(196, 66, 112, ${fillProgress})`;

            document.querySelectorAll(".sanser-front-svg .sanser-svg-fill").forEach((el) => {
                el.style.fill = fillColor;
                el.style.stroke = strokeColor;
            });
            document.querySelectorAll(".sanser-back-svg .sanser-svg-fill").forEach((el) => {
                el.style.fill = fillColor;
                el.style.stroke = strokeColor;
            });
        }

        gsap.to(".sanser-section2", {
            scrollTrigger: {
                trigger: ".sanser-section2",
                start: "top top",
                end: "+=" + window.innerHeight * 5,
                pin: true,
                scrub: true,
                onUpdate: (self) => {
                    const progress = self.progress;
                    const total = data.length;
                    let index = Math.floor(progress * total);
                    if (index >= total) index = total - 1;

                    const frontIndex = index;
                    const backIndex = Math.min(index + 1, total - 1);

                    const conicVal = (progress * total - index) * 100;
                    const fillProgress = progress * total - index;

                    document.querySelector(".sanser-background").style.setProperty("--sanser-conic-t", conicVal + "%");
                    document.querySelector(".sanser-background").style.setProperty("--sanser-conic-b", conicVal + "%");
                    document.querySelector(".sanser-card").style.setProperty("--sanser-rotate-y", -(index * 180) + "deg");

                    updateContent(data[frontIndex], data[backIndex], index + 1, fillProgress);
                },
            },
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHeader);
    } else {
        initHeader();
    }
})();