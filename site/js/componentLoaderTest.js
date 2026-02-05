class ComponentLoader {
    constructor() {
        this.componentsPath = '/components/';
        this.cssPath = '/css/components/';
        this.jsPath = './js/components/';

        this.loadedComponents = new Set();
        this.loadingQueue = [];
        this.isProcessingQueue = false;

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { rootMargin: '50px' }
        );
    }

    /* ===============================
       Scheduling helpers
       =============================== */

    async yieldToMain() {
        if ('scheduler' in window && scheduler.yield) {
            await scheduler.yield();
        } else {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    /* ===============================
       Core loading
       =============================== */

    async loadComponent(name) {
        if (this.loadedComponents.has(name)) return;

        try {
            const res = await fetch(`${this.componentsPath}${name}`);
            const html = await res.text();

            await this.yieldToMain();
            await this.loadCSS(name);
            await this.yieldToMain();

            await this.insertHTML(name, html);
            await this.yieldToMain();

            await this.loadJS(name);

            this.loadedComponents.add(name);
        } catch (err) {
            console.error(`Component load failed: ${name}`, err);
        }
    }

    /* ===============================
       DOM insertion (chunked)
       =============================== */

    async insertHTML(name, html) {
        const placeholders = [
            ...document.querySelectorAll(`[data-component="${name}"]`)
        ];
        if (!placeholders.length) return;

        const template = document.createElement('template');
        template.innerHTML = html;

        for (const placeholder of placeholders) {
            placeholder.replaceWith(
                template.content.cloneNode(true)
            );
            await this.yieldToMain();
        }
    }

    /* ===============================
       Asset loaders
       =============================== */

    loadCSS(name) {
        return new Promise(resolve => {
            if (document.querySelector(`link[href*="${name}.css"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${this.cssPath}${name}.css`;
            link.onload = resolve;
            link.onerror = resolve;
            document.head.appendChild(link);
        });
    }

    loadJS(name) {
        return new Promise(resolve => {
            if (document.querySelector(`script[src*="${name}.js"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.type = 'module';
            script.src = `${this.jsPath}${name}.js`;
            script.onload = resolve;
            script.onerror = resolve;

            // Always async + idle-safe
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => document.body.appendChild(script), {
                    timeout: 2000
                });
            } else {
                setTimeout(() => document.body.appendChild(script), 0);
            }
        });
    }

    /* ===============================
       Queue handling
       =============================== */

    enqueue(name) {
        if (
            !name ||
            this.loadedComponents.has(name) ||
            this.loadingQueue.includes(name)
        ) return;

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

    /* ===============================
       Intersection handling
       =============================== */

    handleIntersection(entries) {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.enqueue(entry.target.getAttribute('data-component'));
            this.observer.unobserve(entry.target);
        }
    }

    /* ===============================
       Boot sequence
       =============================== */

    async loadAll() {
        /* ---- LCP-critical (blocking but staggered) ---- */
        const lcpCritical = ['hero', 'header', 'rotatingBadge'];

        for (const name of lcpCritical) {
            await this.loadComponent(name);
            await this.yieldToMain();
        }

        document.body.style.opacity = '1';

        /* ---- Next visible section ---- */
        await this.loadComponent('aboutUs');
        document.dispatchEvent(new CustomEvent('componentsLoaded'));

        /* ---- Observe AND queue all remaining components ---- */
        const skip = new Set([...lcpCritical, 'aboutUs']);

        document.querySelectorAll('[data-component]').forEach(el => {
            const name = el.getAttribute('data-component');
            if (!name || skip.has(name)) return;

            this.observer.observe(el);
            this.enqueue(name); // 🔥 ensures background loading
        });

        /* ---- Safety fallback: ensure queue runs ---- */
        setTimeout(() => this.processQueue(), 1000);
    }

    destroy() {
        this.observer.disconnect();
        this.loadingQueue.length = 0;
    }
}

/* ===============================
   Init
   =============================== */

document.addEventListener('DOMContentLoaded', () => {
    const loader = new ComponentLoader();
    loader.loadAll();
    window.componentLoader = loader;
});
