class ComponentLoader {
    constructor() {
        this.componentsPath = '/components/';
        this.cssPath = '/css/components/';
        this.jsPath = './js/components/';

        this.loadedComponents = new Set();
        this.loadingQueue = [];
        this.isProcessingQueue = false;
        this.gsapReady = false;
        this.gsapPluginsReady = false;
        this.prefetchWorker = null;
        this.cacheWarmed = false;
        
        // Scroll detection
        this.hasScrolled = false;
        this.scrollHandler = this.handleFirstScroll.bind(this);

        // Critical components (load immediately)
        this.criticalComponents = new Set(['header', 'hero', 'rotatingBadge', 'aboutUs']);
        
        // Components that need GSAP
        this.gsapDependent = new Set([
            'hero', 'aboutUs', 'philosophy', 'techStack',
            'marqueeReveal', 'featured-work', 'diveInWork', 'whatWeDo',
            'testimonial', 'preFooter'
        ]);

        // Queue for components waiting for GSAP
        this.gsapWaitingQueue = [];
        
        // Store all component names for batch loading
        this.remainingComponents = new Set();

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { rootMargin: '100px' }
        );

        this.initPrefetchWorker();
        this.initGSAPLoader();
        this.setupScrollDetection();
    }

    /* ===============================
       Scroll Detection
       =============================== */

    setupScrollDetection() {
        // Listen for first scroll event
        window.addEventListener('scroll', this.scrollHandler, { 
            once: true, 
            passive: true 
        });
        
        // Also listen for wheel event (catches scroll intention even before actual scroll)
        window.addEventListener('wheel', this.scrollHandler, { 
            once: true, 
            passive: true 
        });
        
        // Touch scroll on mobile
        window.addEventListener('touchmove', this.scrollHandler, { 
            once: true, 
            passive: true 
        });
    }

    handleFirstScroll() {
        if (this.hasScrolled) return;
        this.hasScrolled = true;
        
        console.log('[Loader] 🚀 User started scrolling - loading all remaining components');
        
        // Remove listeners
        window.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('wheel', this.scrollHandler);
        window.removeEventListener('touchmove', this.scrollHandler);
        
        // Start loading all remaining components
        this.loadRemainingComponents();
    }

    /* ===============================
       Batch Load Remaining Components
       =============================== */

    async loadRemainingComponents() {
        // Load all remaining components in order of priority
        const componentsToLoad = Array.from(this.remainingComponents);
        
        console.log('[Loader] Loading', componentsToLoad.length, 'remaining components');
        
        for (const name of componentsToLoad) {
            if (this.loadedComponents.has(name)) continue;
            this.enqueue(name);
            
            // Yield every 2 components to keep UI responsive
            if (componentsToLoad.indexOf(name) % 2 === 0) {
                await this.yieldToMain();
            }
        }
    }

    /* ===============================
       GSAP Loading Management
       =============================== */

    initGSAPLoader() {
        this.loadGSAPScripts();
        this.checkGSAPReady();
    }

    async loadGSAPScripts() {
        const gsapScripts = [
            { src: '/js/gsap.min.js', global: 'gsap' },
            { src: '/js/ScrollTrigger.min.js', global: 'ScrollTrigger' },
            { src: '/js/ScrollSmoother.min.js', global: 'ScrollSmoother' },
            { src: '/js/SplitText.min.js', global: 'SplitText' },
            { src: '/js/ScrambleTextPlugin.min.js', global: 'ScrambleTextPlugin' },
            { src: '/js/MotionPath.min.js', global: 'MotionPath' },
            { src: '/js/circletype.min.js', global: 'CircleType' },
            { src: '/js/ScrollToPlugin.min.js', global: 'ScrollToPlugin' }
        ];

        // Load GSAP core first
        await this.loadScript(gsapScripts[0].src);
        await this.waitForGlobal('gsap', 3000);
        this.gsapReady = true;
        console.log('[Loader] GSAP core loaded');

        // Load plugins in parallel
        const pluginPromises = gsapScripts.slice(1).map(script => 
            this.loadScript(script.src)
        );

        await Promise.all(pluginPromises);
        
        await this.waitForGlobal('ScrollTrigger', 2000);
        await this.waitForGlobal('ScrollSmoother', 2000);
        
        this.gsapPluginsReady = true;
        console.log('[Loader] All GSAP plugins loaded');

        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
        }

        this.processGSAPWaitingQueue();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            
            document.head.appendChild(script);
        });
    }

    waitForGlobal(globalName, timeout = 5000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const check = () => {
                if (typeof window[globalName] !== 'undefined') {
                    resolve(window[globalName]);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    console.warn(`[Loader] Timeout waiting for ${globalName}`);
                    resolve(null);
                    return;
                }
                
                requestAnimationFrame(check);
            };
            
            check();
        });
    }

    async checkGSAPReady() {
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (!this.gsapPluginsReady) {
            if (Date.now() - startTime > maxWait) {
                console.error('[Loader] GSAP loading timeout');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async waitForGSAP(timeout = 5000) {
        if (this.gsapPluginsReady) return true;
        
        return new Promise((resolve) => {
            const start = performance.now();
            const check = () => {
                if (this.gsapPluginsReady) {
                    resolve(true);
                    return;
                }
                
                if (performance.now() - start > timeout) {
                    resolve(false);
                    return;
                }
                
                requestAnimationFrame(check);
            };
            check();
        });
    }

    processGSAPWaitingQueue() {
        console.log('[Loader] Processing GSAP waiting queue:', this.gsapWaitingQueue.length);
        
        while (this.gsapWaitingQueue.length > 0) {
            const component = this.gsapWaitingQueue.shift();
            this.loadingQueue.push(component);
        }
        
        this.processQueue();
    }

    /* ===============================
       Web Worker Integration
       =============================== */

    initPrefetchWorker() {
        if (!window.Worker) return;
        
        try {
            this.prefetchWorker = new Worker('/js/prefetch.worker.js');
            
            this.prefetchWorker.onmessage = (e) => {
                const { type, assetType, results, duration } = e.data;
                
                if (type === 'PREFETCH_COMPLETE') {
                    console.log(`[Loader] ${assetType} prefetched in ${duration}ms`);
                    if (assetType === 'gsap') this.cacheWarmed = true;
                }
            };
            
            this.prefetchWorker.postMessage({ type: 'PREFETCH_GSAP' });
            
        } catch (e) {
            console.warn('[Loader] Worker failed:', e);
        }
    }

    /* ===============================
       Core Loading
       =============================== */

    async yieldToMain() {
        if ('scheduler' in window && scheduler.yield) {
            await scheduler.yield();
        } else {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    async loadComponent(name) {
        if (this.loadedComponents.has(name)) return;

        // If component needs GSAP and it's not ready, queue it
        if (this.gsapDependent.has(name) && !this.gsapPluginsReady) {
            if (!this.gsapWaitingQueue.includes(name)) {
                this.gsapWaitingQueue.push(name);
            }
            return;
        }

        const startTime = performance.now();

        try {
            // Load HTML
            const res = await fetch(`${this.componentsPath}${name}.html`);
            const html = await res.text();

            await this.yieldToMain();
            
            // Load CSS
            await this.loadCSS(name);
            await this.yieldToMain();

            // Insert HTML
            await this.insertHTML(name, html);
            await this.yieldToMain();
            
            // Load JS (wait for GSAP if needed)
            if (this.gsapDependent.has(name)) {
                await this.waitForGSAP(5000);
            }
            
            await this.loadJS(name);

            this.loadedComponents.add(name);
            
            const duration = Math.round(performance.now() - startTime);
            console.log(`[Loader] ✓ ${name} (${duration}ms)`);
        } catch (err) {
            console.error(`[Loader] ✗ ${name}:`, err);
        }
    }

    async insertHTML(name, html) {
        const placeholders = [...document.querySelectorAll(`[data-component="${name}"]`)];
        if (!placeholders.length) return;

        const template = document.createElement('template');
        template.innerHTML = html;

        for (const placeholder of placeholders) {
            placeholder.replaceWith(template.content.cloneNode(true));
            await this.yieldToMain();
        }
    }

    loadCSS(name) {
        return new Promise(resolve => {
            const href = `${this.cssPath}${name}.css`;
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = resolve;
            document.head.appendChild(link);
        });
    }

    loadJS(name) {
        return new Promise(resolve => {
            const src = `${this.jsPath}${name}.js`;
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.type = 'module';
            script.src = src;
            script.onload = () => {
                requestAnimationFrame(resolve);
            };
            script.onerror = () => {
                console.error(`[Loader] JS failed: ${name}`);
                resolve();
            };
            
            const isCritical = this.criticalComponents.has(name);
            if (!isCritical && 'requestIdleCallback' in window) {
                requestIdleCallback(() => document.body.appendChild(script), { timeout: 2000 });
            } else {
                document.body.appendChild(script);
            }
        });
    }

    /* ===============================
       Queue & Intersection Management
       =============================== */

    enqueue(name) {
        if (!name || this.loadedComponents.has(name) || this.loadingQueue.includes(name)) return;
        
        if (this.gsapDependent.has(name) && !this.gsapPluginsReady) {
            if (!this.gsapWaitingQueue.includes(name)) {
                this.gsapWaitingQueue.push(name);
            }
            return;
        }
        
        this.loadingQueue.push(name);
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.loadingQueue.length) {
            const name = this.loadingQueue.shift();
            await this.loadComponent(name);
            await this.yieldToMain();
        }

        this.isProcessingQueue = false;
    }

    handleIntersection(entries) {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            
            const name = entry.target.getAttribute('data-component');
            
            // If user hasn't scrolled yet, wait for scroll
            if (!this.hasScrolled) {
                continue;
            }
            
            this.enqueue(name);
            this.observer.unobserve(entry.target);
        }
    }

    /* ===============================
       Boot Sequence
       =============================== */

    async loadAll() {
        const perfStart = performance.now();
        
        // Wait for GSAP core
        await this.waitForGSAP(5000);
        
        // Load only critical components (above the fold)
        const critical = ['header', 'hero', 'rotatingBadge', 'aboutUs'];
        
        for (const name of critical) {
            await this.loadComponent(name);
        }
        
        document.body.style.opacity = '1';
        
        const criticalLoadTime = Math.round(performance.now() - perfStart);
        console.log(`[Loader] Critical components loaded in ${criticalLoadTime}ms`);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('componentsLoaded'));

        // Collect all remaining components
        document.querySelectorAll('[data-component]').forEach(el => {
            const name = el.getAttribute('data-component');
            if (!name || critical.includes(name)) return;
            
            this.remainingComponents.add(name);
            this.observer.observe(el);
        });
        
        console.log(`[Loader] ${this.remainingComponents.size} components waiting for scroll`);
    }

    destroy() {
        this.observer.disconnect();
        this.loadingQueue.length = 0;
        this.gsapWaitingQueue.length = 0;
        window.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('wheel', this.scrollHandler);
        window.removeEventListener('touchmove', this.scrollHandler);
        if (this.prefetchWorker) {
            this.prefetchWorker.terminate();
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.componentLoader = new ComponentLoader();
    window.componentLoader.loadAll();
});