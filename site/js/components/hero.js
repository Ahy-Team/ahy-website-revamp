!(function () {
    function e() {
        // Videos are static in HTML; just attempt to play the visible one and pause the other
        function playVisibleHeroVideo() {
            try {
                const mobileVideo = document.querySelector('.video-container-mobile video');
                const desktopVideo = document.querySelector('.video-container-desktop video');
                const isDesktop = window.innerWidth >= 900;

                const toPlay = isDesktop ? desktopVideo : mobileVideo;
                const toPause = isDesktop ? mobileVideo : desktopVideo;

                if (toPause && !toPause.paused) {
                    try { toPause.pause(); } catch (e) {}
                }

                if (toPlay) {
                    const p = toPlay.play && toPlay.play();
                    if (p && typeof p.catch === 'function') p.catch(() => {});
                }
            } catch (err) {
                // Silent fallback: do nothing if videos are unavailable
            }
        };


        const messages = [
            "From pixels to performance, we design results.",
            "Turning ideas into digital experiences.",
            "Designing success, one pixel at a time.",
            "Where creativity meets technology.",
            "Innovation that drives your business forward."
        ];

        const text = document.querySelector(".hero-copy p");

        if (text) {
            const lastIndex = localStorage.getItem("heroMessageIndex");
            let newIndex;

            do {
                newIndex = Math.floor(Math.random() * messages.length);
            } while (newIndex == lastIndex && messages.length > 1);

            localStorage.setItem("heroMessageIndex", newIndex);
            text.textContent = messages[newIndex];
        }
        
        (function () {
            const e = document.querySelectorAll(".wave");
            if (e.length !== 0) {
                e.forEach((e, t) => {
                    const r = 300 + 20 * t,
                        o = 100 - 10 * t;
                    gsap.timeline({ repeat: -1, yoyo: !0 })
                        .to(e, {
                            attr: { d: `M0,${r} Q250,${r + o} 500,${r} T1000,${r}` },
                            duration: 2 + 0.2 * t,
                            ease: "sine.inOut"
                        });
                    gsap.to(e, {
                        opacity: 0.3,
                        duration: 1.5 + 0.3 * t,
                        repeat: -1,
                        yoyo: !0,
                        ease: "power1.inOut",
                        delay: 0.2 * t
                    });
                });
                gsap.to(e, {
                    y: -20,
                    duration: 3,
                    repeat: -1,
                    yoyo: !0,
                    ease: "power1.inOut",
                    stagger: { each: 0.15, from: "start" }
                });
            }
        })();
        // Attempt to play the appropriate (static) hero video for the current breakpoint
        playVisibleHeroVideo();
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(playVisibleHeroVideo, 150);
        });

        if (window.innerWidth >= 900) {
            const e = document.querySelector(".video-container-desktop"),
                t = document.querySelectorAll(".video-container-desktop .video-title p"),
                r = [
                    { maxWidth: 1000, translateY: -135, movMultiplier: 450 },
                    { maxWidth: 1100, translateY: -135, movMultiplier: 500 },
                    { maxWidth: 1200, translateY: -125, movMultiplier: 550 },
                    { maxWidth: 1300, translateY: -120, movMultiplier: 600 }
                ];
            const o = () => {
                const t = window.innerWidth,
                    o = window.innerHeight,
                    s = e.offsetHeight,
                    l = 100 * ((0.01 * o) / s - 1),
                    n = e.offsetWidth,
                    a = window.innerWidth / n,
                    i = window.innerHeight / s,
                    c = 1.1 * Math.max(a, i);
                let g = 650;
                for (const e of r) {
                    if (t <= e.maxWidth) {
                        g = e.movMultiplier;
                        break;
                    }
                }
                return { translateY: l, movMultiplier: g, targetScale: c };
            };
            const s = o();
            const l = {
                scrollProgress: 0,
                initialTranslatesY: s.translateY,
                currentTranslateY: s.translateY,
                movementMultiplier: s.movMultiplier,
                targetScale: s.targetScale,
                scale: 0.25,
                gap: 2,
                targetMouseX: 0,
                currentMouseX: 0
            };
            window.addEventListener("resize", () => {
                const e = o();
                l.initialTranslatesY = e.translateY;
                l.movementMultiplier = e.movMultiplier;
                l.targetScale = e.targetScale;
                if (l.scrollProgress === 0) {
                    l.currentTranslateY = e.translateY;
                }
            });
            gsap.timeline({
                scrollTrigger: {
                    trigger: ".intro",
                    start: "top bottom",
                    end: "top 10%",
                    scrub: !0,
                    onUpdate: (e) => {
                        l.scrollProgress = e.progress;
                        l.currentTranslateY = gsap.utils.interpolate(l.initialTranslatesY, 0, l.scrollProgress);
                        l.scale = gsap.utils.interpolate(0.25, l.targetScale, l.scrollProgress);
                        l.gap = gsap.utils.interpolate(2, 1, l.scrollProgress);
                    }
                }
            });
            document.addEventListener("mousemove", (e) => {
                l.targetMouseX = 2 * (e.clientX / window.innerWidth - 0.5);
            });
            const n = () => {
                if (window.innerWidth < 900) return;
                const {
                    currentMouseX: r,
                    targetMouseX: o,
                    movementMultiplier: s,
                    currentTranslateY: a,
                    scale: i,
                    gap: g
                } = l;
                const u = i < 0.95 ? o * ((1 - i) * s) : 0;
                l.currentMouseX = gsap.utils.interpolate(r, u, 0.1);
                e.style.transform = `translateY(${a}%) translateX(${l.currentMouseX}px) scale(${i})`;
                e.style.gap = `${g}em`;
                requestAnimationFrame(n);
            };
            n();
        } else {
            // MOBILE HANDLING - With scroll-based scaling animation
            const introSection = document.querySelector(".intro");
            const heroSection = document.querySelector(".hero");
            const videoContainer = document.querySelector(".video-container-mobile");
            const videoPreview = document.querySelector(".video-container-mobile .video-preview");
            const videoWrapper = document.querySelector(".video-container-mobile .video-wrapper");
            const video = document.querySelector(".video-container-mobile video");

            // Kill any existing intro-related ScrollTriggers
            ScrollTrigger.getAll().forEach(st => {
                if (st.trigger && st.trigger.classList.contains("intro")) {
                    st.kill(true);
                }
            });

            // Completely hide and remove intro section from layout
            if (introSection) {
                introSection.style.cssText = `
                    display: none !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    visibility: hidden !important;
                    position: absolute !important;
                `;
            }

            // Ensure hero section has proper containment
            if (heroSection) {
                heroSection.style.overflow = 'hidden';
            }

            // Animation state for mobile
            const mobileState = {
                scrollProgress: 0,
                scale: 0.75,
                targetScale: 1.0,
                borderRadius: 24, // 1.5rem
                targetBorderRadius: 12
            };

            // Set initial transform and ensure visibility
            if (videoContainer) {
                videoContainer.style.transform = `scale(${mobileState.scale})`;
                videoContainer.style.transformOrigin = 'center center';
                videoContainer.style.opacity = '1';
            }

            // Scroll-based scaling animation
            gsap.timeline({
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "top -25%",
                    scrub: 0.5,
                    onUpdate: (self) => {
                        mobileState.scrollProgress = self.progress;
                        
                        // Ease the progress for smoother feel
                        const easeProgress = gsap.parseEase("power2.out")(mobileState.scrollProgress);
                        
                        // Scale from 0.75 to 1.0
                        mobileState.scale = gsap.utils.interpolate(0.75, mobileState.targetScale, easeProgress);
                        
                        // Reduce border radius slightly on scroll
                        const currentRadius = gsap.utils.interpolate(mobileState.borderRadius, mobileState.targetBorderRadius, easeProgress);
                        const radiusValue = `${currentRadius}px`;
                        
                        // Apply transforms
                        if (videoContainer) {
                            videoContainer.style.transform = `scale(${mobileState.scale})`;
                        }
                        
                        // Apply border radius to video elements
                        if (videoPreview) videoPreview.style.borderRadius = radiusValue;
                        if (videoWrapper) videoWrapper.style.borderRadius = radiusValue;
                        if (video) video.style.borderRadius = radiusValue;
                    }
                }
            });

            // Refresh ScrollTrigger after layout changes
            requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
        }
    }
    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", e)
        : e();
})();