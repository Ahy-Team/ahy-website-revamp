// =========================
// MARQUEE LOOP
// =========================
function horizontalLoop(items, config) {
    const { repeat = -1, speed = 1, paddingRight = 0 } = config;
    const tl = gsap.timeline({ repeat, defaults: { ease: "none" } });
    const len = items.length;
    const startX = items[0].offsetLeft;
    const widths = [];
    const xPercents = [];
    const pxPerSec = speed * 100;

    // Batch set initial transforms
    gsap.set(items, {
        xPercent: (i, el) => {
            const w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
            xPercents[i] = (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 + gsap.getProperty(el, "xPercent");
            return xPercents[i];
        }
    });
    gsap.set(items, { x: 0 });

    const lastItem = items[len - 1];
    const totalWidth = lastItem.offsetLeft + (xPercents[len - 1] / 100) * widths[len - 1] - startX + 
        lastItem.offsetWidth * gsap.getProperty(lastItem, "scaleX") + paddingRight;

    for (let i = 0; i < len; i++) {
        const item = items[i];
        const curX = (xPercents[i] / 100) * widths[i];
        const distanceToStart = item.offsetLeft + curX - startX;
        const distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
        const dur1 = distanceToLoop / pxPerSec;
        const dur2 = (totalWidth - distanceToLoop) / pxPerSec;

        tl.to(item, {
            xPercent: ((curX - distanceToLoop) / widths[i]) * 100,
            duration: dur1
        }, 0).fromTo(item, {
            xPercent: ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
        }, {
            xPercent: xPercents[i],
            duration: dur2,
            immediateRender: false
        }, dur1);
    }

    return tl.progress(1, true).progress(0, true);
}

function setupMarqueeAnimation() {
    const track = document.querySelector(".marquee-track");
    if (!track) return;

    const items = gsap.utils.toArray(".marquee-track h1");
    const w = window.innerWidth;
    const buffer = w;
    
    // Set styles once
    items.forEach(el => {
        el.style.flex = "0 0 auto";
        el.style.whiteSpace = "nowrap";
        el.style.marginRight = el.style.marginRight || "30px";
    });

    let totalWidth = items.reduce((sum, el) => sum + parseFloat(gsap.getProperty(el, "width", "px")), 0);
    let idx = 0;

    // Clone items if needed
    while (totalWidth < w + buffer && idx < 50) {
        const clone = items[idx % items.length].cloneNode(true);
        clone.style.flex = "0 0 auto";
        clone.style.whiteSpace = "nowrap";
        clone.style.marginRight = "30px";
        track.appendChild(clone);
        items.push(clone);
        totalWidth += parseFloat(gsap.getProperty(clone, "width", "px"));
        idx++;
    }

    if (items.length) {
        horizontalLoop(items, { repeat: -1, paddingRight: 30, speed: 0.45 });
    }
}

// =========================
// MAIN ANIMATION
// =========================
gsap.registerPlugin(ScrollTrigger, SplitText);

const card = document.querySelector(".marquee-card");
const title = card.querySelector(".marquee-card-title h1");

// Split title text
if (title?.textContent.trim()) {
    const split = new SplitText(title, { type: "words,chars", wordsClass: "word", charsClass: "char", tag: "div" });
    split.chars.forEach(char => char.innerHTML = `<span>${char.textContent}</span>`);
}

// Get responsive border radius
const getBorderRadius = () => {
    const w = window.innerWidth;
    return w <= 400 ? 25 : w <= 600 ? 30 : w <= 900 ? 40 : w <= 1200 ? 50 : 150;
};

// Cache DOM elements
const wrapper = card.querySelector(".marquee-card-img");
const img = card.querySelector(".marquee-img");
const marquee = card.querySelector(".marquee-card-marquee .marquee-track");
const titleChars = card.querySelectorAll(".char span");
const desc = card.querySelector(".marquee-card-description");
const overlay = card.querySelector(".marquee-overlay");
const btn = card.querySelector(".blreveal-center-btn");

const baseBR = getBorderRadius();
const initBR = baseBR * 2.5;

// Set initial state
gsap.set(wrapper, { scale: 0.3, borderRadius: initBR });
if (img) gsap.set(img, { scale: 2 });

// Pin card
ScrollTrigger.create({
    trigger: card,
    start: "top top",
    end: "bottom+=200px",
    pin: true,
    pinSpacing: true
});

// Main scroll animation
let contentVisible = false;

ScrollTrigger.create({
    trigger: card,
    start: "top top",
    end: "bottom +=400vh",
    scrub: 1,
    onUpdate: ({ progress: p }) => {
        const scale = 0.3 + p * 0.7;
        const br = initBR - p * initBR;
        const innerScale = 2 - p;

        // Update transforms
        gsap.set(wrapper, { scale, borderRadius: br });
        if (img) gsap.set(img, { scale: innerScale });

        // Fade marquee
        if (marquee) {
            gsap.set(marquee, { 
                opacity: scale <= 0.6 ? Math.max(0, 1 - (scale - 0.3) / 0.3) : 0 
            });
        }

        // Fade overlay
        if (overlay) gsap.set(overlay, { opacity: Math.min(0.85, p * 0.85) });

        // Animate content
        if (p >= 0.95 && !contentVisible) {
            contentVisible = true;
            gsap.to(titleChars, { x: "0%", duration: 0.75, ease: "power4.out" });
            gsap.to(desc, { x: 0, opacity: 1, duration: 0.75, delay: 0.1, ease: "power4.out" });
            gsap.to(btn, { opacity: 1, y: 0, duration: 0.75, delay: 0.25, ease: "power4.out" });
        } else if (p < 0.95 && contentVisible) {
            contentVisible = false;
            gsap.to(titleChars, { x: "100%", duration: 0.5, ease: "power4.out" });
            gsap.to(desc, { x: "40px", opacity: 0, duration: 0.5, ease: "power4.out" });
            gsap.to(btn, { opacity: 0, y: 30, duration: 0.5, ease: "power4.out" });
        }
    }
});

// Button animation
const btns = document.querySelectorAll(".blreveal-center-btn");
btns.forEach(button => {
    const wrapper = button.querySelector(".blreveal-btn-text-wrapper");
    const defaultText = button.getAttribute("data-default");
    const hoverText = button.getAttribute("data-hover");
    
    const toSpans = text => text.split("").map(c => `<span class="char">${c === " " ? "&nbsp;" : c}</span>`).join("");
    
    wrapper.innerHTML = `
        <div class="text-default">${toSpans(defaultText)}</div>
        <div class="text-hover">${toSpans(hoverText)}</div>
    `;

    const defChars = wrapper.querySelectorAll(".text-default .char");
    const hovChars = wrapper.querySelectorAll(".text-hover .char");

    button.addEventListener("mouseenter", () => {
        gsap.to(defChars, { y: "-100%", opacity: 0, stagger: 0.02, duration: 0.4, ease: "power2.inOut" });
        gsap.to(hovChars, { y: "0%", opacity: 1, stagger: 0.02, duration: 0.4, ease: "power2.inOut" });
    });

    button.addEventListener("mouseleave", () => {
        gsap.to(hovChars, { y: "100%", opacity: 0, stagger: 0.02, duration: 0.4, ease: "power2.inOut" });
        gsap.to(defChars, { y: "0%", opacity: 1, stagger: 0.02, duration: 0.4, ease: "power2.inOut" });
    });
});

// Start marquee
setupMarqueeAnimation();

// Debounced resize
let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
});