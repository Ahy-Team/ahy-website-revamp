// OPTIMIZED main.js - iOS-FIXED + Reflow Optimized + Smart bfcache handling + GSAP wait logic

// Wait for GSAP to be available
async function waitForGSAP(timeout = 10000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const check = () => {
            if (typeof gsap !== 'undefined' && 
                typeof ScrollTrigger !== 'undefined' && 
                typeof ScrollSmoother !== 'undefined') {
                console.log('[Main] GSAP ready');
                resolve(true);
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                console.error('[Main] GSAP timeout - not all plugins loaded');
                resolve(false);
                return;
            }
            
            requestAnimationFrame(check);
        };
        
        check();
    });
}

// Detect iOS and Mobile
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// State
let smoother;
let cachedViewportWidth = window.innerWidth;
let bfcacheHandled = false;

// Utility to break up long tasks
const yieldToMain = () =>
    new Promise((resolve) => {
        if ("scheduler" in window && "yield" in scheduler) {
            scheduler.yield().then(resolve);
        } else {
            setTimeout(resolve, 0);
        }
    });

const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

// Init - CHUNKED to reduce TBT
document.addEventListener(
    "componentsLoaded",
    async () => {
        console.log('[Main] Components loaded event received');
        
        // Wait for GSAP to be fully loaded
        const gsapReady = await waitForGSAP();
        
        if (!gsapReady) {
            console.error('[Main] GSAP failed to load - skipping animations');
            return;
        }

        // Task 1: ScrollSmoother (critical)
        try {
            window.smoother = initScrollSmoother();
            console.log('[Main] ScrollSmoother initialized');
        } catch (e) {
            console.error('[Main] ScrollSmoother init failed:', e);
        }

        await yieldToMain();

        // Task 2: GSAP animations (can be deferred)
        try {
            initIntroPinWithAboutUs();
            console.log('[Main] Intro pin animations initialized');
        } catch (e) {
            console.error('[Main] Intro pin init failed:', e);
        }
    },
    { once: true },
);

function initScrollSmoother() {
    // Ensure GSAP plugins are available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof ScrollSmoother === 'undefined') {
        console.error('[Main] GSAP not ready for ScrollSmoother');
        return null;
    }

    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    // ✅ Configure ScrollTrigger to reduce reflows
    ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
        syncInterval: 250, // Reduce update frequency
    });

    // iOS-optimized configuration
    smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: isIOS ? 0 : 1.5, // Disable smooth on iOS, keep on desktop
        effects: isIOS ? false : true, // Disable effects on iOS
        smoothTouch: false, // Always disable smoothTouch (causes iOS issues)
        normalizeScroll: isIOS ? true : true, // normalizeScroll helps on iOS
        ignoreMobileResize: true,
        speed: 1,
        maxSpeed: 1,
    });

    // iOS-specific: Enable native momentum scrolling
    if (isIOS) {
        document.body.style.webkitOverflowScrolling = "touch";
        document.documentElement.style.webkitOverflowScrolling = "touch";

        const wrapper = document.querySelector("#smooth-wrapper");
        if (wrapper) {
            wrapper.style.webkitOverflowScrolling = "touch";
        }
    }

    // ✅ Debounced resize with RAF to prevent reflows
    window.addEventListener(
        "resize",
        debounce(() => {
            requestAnimationFrame(() => {
                cachedViewportWidth = window.innerWidth;
                smoother?.refresh();
            });
        }, 250),
        { passive: true },
    );

    // ✅ Auto-refresh with ResizeObserver (more efficient)
    const content = document.querySelector("#smooth-content");
    if (content) {
        const ro = new ResizeObserver(debounce(() => {
            requestAnimationFrame(() => smoother?.refresh());
        }, 500));
        ro.observe(content);
    }

    return smoother;
}

let introTweens = [];
let introTriggers = [];

function initIntroPinWithAboutUs() {
    // Ensure GSAP is available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error('[Main] GSAP not ready for intro pin');
        return;
    }

    // Cleanup previous instances
    introTweens.forEach(t => t.kill());
    introTweens = [];
    introTriggers.forEach(t => t.kill());
    introTriggers = [];

    const intro = document.querySelector(".intro");
    const aboutUs = document.querySelector(".about-scroll-container");
    if (!aboutUs) return;

    const isMobileView = cachedViewportWidth <= 900;
    if (isMobileView) {
        gsap.set(aboutUs, { opacity: 1 });
        if (intro) intro.style.display = "none";
        requestAnimationFrame(() => ScrollTrigger.refresh());
        return;
    }

    if (!intro) return;

    // ✅ SINGLE SOURCE OF TRUTH
    const scroller = isIOS ? window : "#smooth-wrapper";

    // ✅ Batch all ScrollTrigger creation in single RAF to minimize reflows
    requestAnimationFrame(() => {
        const pinT = ScrollTrigger.create({
            trigger: intro,
            start: "top top",
            endTrigger: aboutUs,
            end: "top top",
            pin: true,
            pinSpacing: false,
            scrub: true,
            scroller,
            invalidateOnRefresh: false, // ✅ Prevent unnecessary recalculations
            fastScrollEnd: true, // ✅ Optimize for fast scrolling
        });
        introTriggers.push(pinT);

        const t1 = gsap.to(intro, {
            opacity: 1,
            scrollTrigger: {
                trigger: aboutUs,
                start: "top bottom",
                end: "top top",
                scrub: true,
                scroller,
                invalidateOnRefresh: false,
                fastScrollEnd: true,
                // ✅ Use gsap.set instead of direct style manipulation to reduce reflows
                onUpdate(self) {
                    gsap.set(intro, {
                        opacity: 1 - self.progress,
                        pointerEvents: self.progress > 0.1 ? "none" : "auto"
                    });
                },
            },
        });
        introTweens.push(t1);

        const t2 = gsap.fromTo(
            aboutUs,
            { opacity: 0 },
            {
                opacity: 1,
                scrollTrigger: {
                    trigger: aboutUs,
                    start: "top bottom",
                    end: "top top",
                    scrub: true,
                    scroller,
                    invalidateOnRefresh: false,
                    fastScrollEnd: true,
                },
            },
        );
        introTweens.push(t2);

        // ✅ Double RAF for refresh to ensure layout stability
        requestAnimationFrame(() => {
            requestAnimationFrame(() => ScrollTrigger.refresh());
        });
    });
}

// ✅ Smart bfcache handling: Mobile reload, Desktop reinitialize
window.addEventListener(
    "pageshow",
    async (event) => {
        if (event.persisted && !bfcacheHandled) {
            bfcacheHandled = true;
            
            console.log('[Main] Page restored from bfcache');
            
            // ✅ Mobile: Force reload for clean state
            if (isMobile) {
                window.location.reload();
                return;
            }
            
            // ✅ Desktop: Reinitialize GSAP/ScrollTrigger
            cachedViewportWidth = window.innerWidth;
            
            // Wait for GSAP
            const gsapReady = await waitForGSAP();
            if (!gsapReady) {
                console.error('[Main] GSAP not available after bfcache restore');
                return;
            }
            
            try {
                if (smoother) smoother.kill();
            } catch (e) {
                console.error('[Main] Error killing smoother:', e);
            }
            
            // Reinitialize with yields
            window.smoother = initScrollSmoother();
            await yieldToMain();
            initIntroPinWithAboutUs();
            
            // ✅ Refresh in RAF to prevent reflows
            requestAnimationFrame(() => {
                requestAnimationFrame(() => ScrollTrigger.refresh());
            });
        }
    }
);

window.addEventListener(
    "beforeunload",
    () => {
        try {
            if (window.aboutUsThreeCleanup) window.aboutUsThreeCleanup();
        } catch (e) {}
        if (smoother) smoother.kill();
    },
    { once: true },
);

// Allow native scrolling inside cookie consent modal
window.addEventListener("load", () => {
    const ccRoot = document.getElementById("cc--main");
    if (!ccRoot) return;

    ["wheel", "touchstart", "touchmove"].forEach((event) => {
        ccRoot.addEventListener(event, (e) => e.stopPropagation(), { passive: true });
    });
});

// Service Worker registration
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .then((reg) => {
                console.log('[Main] ServiceWorker registered');
                // Optional: listen for updates
                reg.addEventListener("updatefound", () => {
                    const newSW = reg.installing;
                    newSW.addEventListener("statechange", () => {
                        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
                            console.log('[Main] New content available');
                        }
                    });
                });
            })
            .catch((err) => {
                console.error('[Main] ServiceWorker registration failed:', err);
            });
    });
}