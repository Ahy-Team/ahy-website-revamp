function initParallaxSection(container = document) {
    const pkImages = container.querySelectorAll(".pk-scroll__img");
    if (!pkImages.length) return;

    // Pin main section for extended parallax
    ScrollTrigger.create({
        trigger: container.querySelector(".pk-scroll"),
        start: "top top",
        end: "+=300%", // extend for more scroll effect
        // pin: true,
        scrub: true,
    });

    // Layered parallax
    pkImages.forEach((img, i) => {
        gsap.fromTo(
            img,
            { y: 200 * (i+1), rotation: 0 },
            {
                y: -100 * (i+1),
                rotation: gsap.utils.random(-15, 15),
                ease: "power2.out",
                scrollTrigger: {
                    trigger: container.querySelector(".pk-scroll"),
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            }
        );
    });

    // Hover tilt effect
    pkImages.forEach((img) => {
        const rotX = gsap.quickTo(img, "rotationX", { duration: 0.4, ease: "power3.out" });
        const rotY = gsap.quickTo(img, "rotationY", { duration: 0.4, ease: "power3.out" });
        const scale = gsap.quickTo(img, "scale", { duration: 0.3, ease: "power1.out" });

        img.addEventListener("mousemove", (e) => {
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            rotX(gsap.utils.mapRange(0, rect.height, 15, -15, y));
            rotY(gsap.utils.mapRange(0, rect.width, -15, 15, x));
            scale(1.05);
        });

        img.addEventListener("mouseleave", () => {
            rotX(0);
            rotY(0);
            scale(1);
        });
    });
}
initParallaxSection();
