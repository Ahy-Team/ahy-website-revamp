class ComponentLoader {
    constructor() {
        this.componentsPath = './components/';
        this.cssPath = './css/components/';
        this.jsPath = './js/components/';
        this.loadedComponents = new Set();
        this.loadingQueue = [];
        this.isProcessingQueue = false;
        
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            rootMargin: '50px'
        });
    }

    // Yield to main thread helper
    async yieldToMain() {
        return new Promise(resolve => {
            if ('scheduler' in window && 'yield' in scheduler) {
                scheduler.yield().then(resolve);
            } else {
                setTimeout(resolve, 0);
            }
        });
    }

    // Check if we should yield (every ~50ms of work)
    shouldYield() {
        return navigator.scheduling?.isInputPending?.() || false;
    }

    async loadComponent(name) {
        if (this.loadedComponents.has(name)) return;

        try {
            // Load HTML
            const htmlResponse = await fetch(`${this.componentsPath}${name}.html`);
            const html = await htmlResponse.text();

            // Yield before DOM manipulation
            await this.yieldToMain();

            // Load CSS
            await this.loadCSS(name);

            // Yield before inserting HTML
            if (this.shouldYield()) {
                await this.yieldToMain();
            }

            // Insert HTML into all placeholders
            const placeholders = document.querySelectorAll(`[data-component="${name}"]`);
            placeholders.forEach(placeholder => {
                placeholder.innerHTML = html;
                placeholder.removeAttribute('data-component');
            });

            // Yield before JS execution
            await this.yieldToMain();

            // Load and execute JS
            await this.loadJS(name);

            this.loadedComponents.add(name);
        } catch (error) {
            console.error(`Error loading component ${name}:`, error);
        }
    }

    loadCSS(name) {
        return new Promise((resolve) => {
            // Check if already loaded
            const existing = document.querySelector(`link[href*="${name}.css"]`);
            if (existing) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${this.cssPath}${name}.css`;
            link.onload = resolve;
            link.onerror = () => resolve();
            document.head.appendChild(link);
        });
    }

    loadJS(name) {
        return new Promise((resolve) => {
            // Check if already loaded
            const existing = document.querySelector(`script[src*="${name}.js"]`);
            if (existing) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `${this.jsPath}${name}.js`;
            script.async = true; // Non-blocking
            script.onload = resolve;
            script.onerror = () => resolve();
            document.body.appendChild(script);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const name = entry.target.getAttribute('data-component');
                if (name) {
                    this.loadComponent(name);
                    this.observer.unobserve(entry.target);
                }
            }
        });
    }

    // Process queue with yielding to prevent TBT spikes
    async processQueue() {
        if (this.isProcessingQueue || this.loadingQueue.length === 0) return;
        
        this.isProcessingQueue = true;

        while (this.loadingQueue.length > 0) {
            const name = this.loadingQueue.shift();
            
            // Load component
            await this.loadComponent(name);
            
            // Yield after each component to keep main thread responsive
            await this.yieldToMain();
        }

        this.isProcessingQueue = false;
    }

    // Queue remaining components for background loading
    async queueRemainingComponents() {
        // Wait a bit for critical content to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get all remaining unloaded components
        const remaining = document.querySelectorAll('[data-component]');
        const componentNames = new Set();
        
        remaining.forEach(el => {
            const name = el.getAttribute('data-component');
            if (name && !this.loadedComponents.has(name)) {
                componentNames.add(name);
            }
        });

        // Add to queue
        this.loadingQueue.push(...componentNames);

        // Start processing queue when idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.processQueue(), { timeout: 2000 });
        } else {
            setTimeout(() => this.processQueue(), 1000);
        }
    }

    async loadAll() {
        // Load LCP-critical components in parallel for fastest FCP/LCP
        const lcpCritical = ['hero', 'header'];
        
        // Load LCP components in parallel (faster than sequential)
        await Promise.all(lcpCritical.map(name => this.loadComponent(name)));
        
        // Mark LCP complete - body is now visible
        document.body.style.opacity = '1';
        
        // Yield to allow paint
        await this.yieldToMain();
        
        // Load aboutUs next (visible on scroll)
        await this.loadComponent('aboutUs');
        
        // Dispatch event that critical components are loaded
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        
        await this.yieldToMain();

        // Observe remaining components for lazy loading on scroll
        const criticalComponents = [...lcpCritical, 'aboutUs'];
        const allComponents = document.querySelectorAll('[data-component]');
        allComponents.forEach(el => {
            const name = el.getAttribute('data-component');
            if (name && !criticalComponents.includes(name)) {
                this.observer.observe(el);
            }
        });

        // Queue and load remaining components in background
        this.queueRemainingComponents();
    }

    // Cleanup method
    destroy() {
        this.observer.disconnect();
        this.loadingQueue = [];
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const loader = new ComponentLoader();
    loader.loadAll();
    
    // Store reference for cleanup if needed
    window.componentLoader = loader;
});