// UNIFIED main.js - Optimized for BOTH Mobile & Desktop
// Adaptive performance based on device capabilities

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

// Device Detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /(iPad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(navigator.userAgent);
const isDesktop = !isMobile && !isTablet;

// Performance tier detection
const getPerformanceTier = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 2;
    
    // Low-end: slow connection, low memory, few cores
    if ((connection && connection.effectiveType === '2g') || memory < 4 || cores < 4) {
        return 'low';
    }
    
    // High-end: desktop or powerful mobile
    if (isDesktop || (memory >= 8 && cores >= 8)) {
        return 'high';
    }
    
    return 'medium';
};

const performanceTier = getPerformanceTier();
console.log(`[Main] Device: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}, Performance: ${performanceTier}`);

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

        // Task 2: GSAP animations (can be deferred on mobile)
        try {
            if (isMobile && performanceTier === 'low') {
                // Defer animations on low-end mobile
                requestIdleCallback(() => {
                    initIntroPinWithAboutUs();
                    console.log('[Main] Intro pin animations initialized (deferred)');
                }, { timeout: 3000 });
            } else {
                initIntroPinWithAboutUs();
                console.log('[Main] Intro pin animations initialized');
            }
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

    // ✅ Configure ScrollTrigger based on device
    ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
        syncInterval: isMobile ? 500 : 250, // Less frequent on mobile
    });

    // Adaptive ScrollSmoother configuration
    const smootherConfig = {
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        ignoreMobileResize: true,
    };

    if (isDesktop) {
        // Desktop: Full smooth scrolling with effects
        Object.assign(smootherConfig, {
            smooth: 1.5,
            effects: true,
            smoothTouch: false,
            normalizeScroll: true,
            speed: 1,
            maxSpeed: 1,
        });
    } else if (isTablet) {
        // Tablet: Moderate smoothing
        Object.assign(smootherConfig, {
            smooth: performanceTier === 'high' ? 1.2 : 0,
            effects: performanceTier === 'high',
            smoothTouch: false,
            normalizeScroll: true,
            speed: 1,
            maxSpeed: 1,
        });
    } else {
        // Mobile: Native scrolling (iOS) or minimal smoothing (Android)
        Object.assign(smootherConfig, {
            smooth: isIOS ? 0 : (performanceTier === 'high' ? 0.8 : 0),
            effects: false,
            smoothTouch: false,
            normalizeScroll: true,
            speed: 1,
            maxSpeed: 1,
        });
    }

    smoother = ScrollSmoother.create(smootherConfig);

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
    const resizeDelay = isMobile ? 500 : 250;
    window.addEventListener(
        "resize",
        debounce(() => {
            requestAnimationFrame(() => {
                cachedViewportWidth = window.innerWidth;
                smoother?.refresh();
            });
        }, resizeDelay),
        { passive: true },
    );

    // ✅ Auto-refresh with ResizeObserver (desktop only for better performance)
    if (isDesktop) {
        const content = document.querySelector("#smooth-content");
        if (content) {
            const ro = new ResizeObserver(debounce(() => {
                requestAnimationFrame(() => smoother?.refresh());
            }, 500));
            ro.observe(content);
        }
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
    const scroller = (isIOS || isMobile) ? window : "#smooth-wrapper";

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
            invalidateOnRefresh: false,
            fastScrollEnd: true,
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

// ✅ Smart bfcache handling: Device-aware approach
window.addEventListener(
    "pageshow",
    async (event) => {
        if (event.persisted && !bfcacheHandled) {
            bfcacheHandled = true;
            
            console.log('[Main] Page restored from bfcache');
            
            // ✅ Mobile/Low-performance: Force reload for clean state
            if (isMobile && performanceTier === 'low') {
                window.location.reload();
                return;
            }
            
            // ✅ Desktop/High-performance: Reinitialize GSAP/ScrollTrigger
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

// Service Worker registration with device-aware strategy
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        const swPath = isMobile ? "/sw.js" : "/sw-desktop.js";
        
        navigator.serviceWorker
            .register(swPath, { scope: "/" })
            .then((reg) => {
                console.log(`[Main] ServiceWorker registered (${isMobile ? 'mobile' : 'desktop'} strategy)`);
                
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