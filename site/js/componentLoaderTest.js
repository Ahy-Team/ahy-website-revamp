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

        // Components that absolutely need GSAP
        this.gsapDependent = new Set([
            'hero', 'aboutUs', 'philosophy', 'techStack',
            'marqueeReveal', 'featured-work', 'diveInWork', 'whatWeDo',
            'testimonial'
        ]);

        // Queue for components waiting for GSAP
        this.gsapWaitingQueue = [];

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { rootMargin: '100px' }
        );

        this.initPrefetchWorker();
        this.initGSAPLoader();
    }

    /* ===============================
       GSAP Loading Management
       =============================== */

    initGSAPLoader() {
        // Start loading GSAP scripts immediately
        this.loadGSAPScripts();

        // Listen for when GSAP is ready
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
        
        // Wait for GSAP to be available
        await this.waitForGlobal('gsap', 3000);
        this.gsapReady = true;
        console.log('[Loader] GSAP core loaded');

        // Load plugins in parallel
        const pluginPromises = gsapScripts.slice(1).map(script => 
            this.loadScript(script.src)
        );

        await Promise.all(pluginPromises);
        
        // Wait for all plugins
        await this.waitForGlobal('ScrollTrigger', 2000);
        await this.waitForGlobal('ScrollSmoother', 2000);
        
        this.gsapPluginsReady = true;
        console.log('[Loader] All GSAP plugins loaded');

        // Register plugins
        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
        }

        // Process any components waiting for GSAP
        this.processGSAPWaitingQueue();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            script.onload = () => {
                console.log('[Loader] Script loaded:', src);
                resolve();
            };
            script.onerror = () => {
                console.error('[Loader] Script failed:', src);
                reject(new Error(`Failed to load ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    waitForGlobal(globalName, timeout = 5000) {
        return new Promise((resolve, reject) => {
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
        const maxWait = 10000; // 10 seconds max
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
                    console.warn('[Loader] GSAP timeout');
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
                    console.log(`[Loader] ${assetType} prefetched in ${duration}ms`, results);
                    
                    if (assetType === 'gsap') {
                        this.cacheWarmed = true;
                    }
                }
                
                if (type === 'CACHE_STATUS') {
                    console.log('[Loader] Cache status:', e.data.status);
                }
            };
            
            // Start prefetching (this warms the cache but doesn't execute scripts)
            this.prefetchWorker.postMessage({ type: 'PREFETCH_GSAP' });
            this.prefetchWorker.postMessage({ 
                type: 'PREFETCH_COMPONENTS', 
                priority: 'low' 
            });
            
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
            console.log(`[Loader] Queueing ${name} - waiting for GSAP`);
            if (!this.gsapWaitingQueue.includes(name)) {
                this.gsapWaitingQueue.push(name);
            }
            return;
        }

        try {
            const res = await fetch(`${this.componentsPath}${name}`);
            const html = await res.text();

            await this.yieldToMain();
            await this.loadCSS(name);
            await this.yieldToMain();
            await this.insertHTML(name, html);
            await this.yieldToMain();
            
            // For GSAP-dependent components, wait for GSAP before loading JS
            if (this.gsapDependent.has(name)) {
                await this.waitForGSAP(5000);
            }
            
            await this.loadJS(name);

            this.loadedComponents.add(name);
            console.log(`[Loader] Component loaded: ${name}`);
        } catch (err) {
            console.error(`[Loader] Failed: ${name}`, err);
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
                console.log(`[Loader] JS loaded: ${name}`);
                requestAnimationFrame(resolve);
            };
            script.onerror = () => {
                console.error(`[Loader] JS failed: ${name}`);
                resolve();
            };
            
            const isCritical = ['hero', 'header'].includes(name);
            if (!isCritical && 'requestIdleCallback' in window) {
                requestIdleCallback(() => document.body.appendChild(script), { timeout: 2000 });
            } else {
                document.body.appendChild(script);
            }
        });
    }

    /* ===============================
       Queue & Intersection
       =============================== */

    enqueue(name) {
        if (!name || this.loadedComponents.has(name) || this.loadingQueue.includes(name)) return;
        
        // If component needs GSAP and it's not ready, add to waiting queue
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
            this.enqueue(name);
            this.observer.unobserve(entry.target);
        }
    }

    /* ===============================
       Boot Sequence (Optimized)
       =============================== */

    async loadAll() {
        // Wait for GSAP core to be ready before loading hero
        await this.waitForGSAP(5000);
        
        // Load critical components
        await this.loadComponent('header');
        await this.loadComponent('hero');
        
        document.body.style.opacity = '1';
        
        // Load next visible
        await this.loadComponent('aboutUs');
        
        // Dispatch event that components are loaded
        document.dispatchEvent(new CustomEvent('componentsLoaded'));

        // Lazy load rest
        const skip = new Set(['hero', 'aboutUs', 'header']);
        document.querySelectorAll('[data-component]').forEach(el => {
            const name = el.getAttribute('data-component');
            if (!name || skip.has(name)) return;
            this.observer.observe(el);
            this.enqueue(name);
        });

        setTimeout(() => this.processQueue(), 100);
    }

    destroy() {
        this.observer.disconnect();
        this.loadingQueue.length = 0;
        this.gsapWaitingQueue.length = 0;
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