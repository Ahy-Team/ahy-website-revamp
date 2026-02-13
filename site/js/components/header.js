/*!
 * Updated Menu Component with Dynamic Grid Layout
 * Automatically counts submenu items and applies appropriate data-count attribute
 */

!function() {
    function initMenu() {
        const menuToggle = document.querySelector(".menu-toggle");
        const overlay = document.querySelector(".overlay");
        const overlayMenu = document.querySelector(".overlay-menu");
        const hamburger = document.querySelector(".hamburger");

        if (!(menuToggle && overlay && overlayMenu && hamburger)) return;

        let isOpen = false;

        // Hover effects (desktop only)
        if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            menuToggle.addEventListener("mouseenter", () => menuToggle.classList.add("is-hover"));
            menuToggle.addEventListener("mouseleave", () => menuToggle.classList.remove("is-hover"));
        }

        // Main animation timeline
        const timeline = gsap.timeline({
            paused: true,
            defaults: { ease: "power3.out" }
        });

        timeline
            .to(".block", {
                duration: 1,
                y: "0%",
                stagger: 0.075,
                ease: "power3.inOut"
            })
            .to(".modern-menu", {
                opacity: 1,
                duration: 0.3
            }, "-=0.6")
            .to(".modern-menu-item", {
                opacity: 1,
                y: 0,
                stagger: 0.07,
                duration: 0.6
            }, "-=0.3");

        // Menu toggle click
        menuToggle.addEventListener("click", () => {
            if (timeline.isActive()) return;

            if (isOpen) {
                menuToggle.classList.remove("opened");
                hamburger.classList.remove("active");
                timeline.reverse();
                timeline.eventCallback("onReverseComplete", () => {
                    menuToggle.classList.remove("is-hover");
                    overlay.classList.remove("active");
                    overlayMenu.classList.remove("active");
                    document.body.style.overflow = "";
                    gsap.set(".modern-menu", { opacity: 0 });
                });
            } else {
                menuToggle.classList.remove("is-hover");
                overlay.classList.add("active");
                overlayMenu.classList.add("active");
                menuToggle.classList.add("opened");
                hamburger.classList.add("active");
                document.body.style.overflow = "hidden";
                gsap.set(".modern-menu-item", { opacity: 0, y: 40 });
                timeline.play();
            }

            isOpen = !isOpen;
        });

        // ====================================
        // DYNAMIC SUBMENU GRID SETUP
        // ====================================
        
        // Count items and add data-count attribute to each submenu
        const allSubmenus = document.querySelectorAll(".submenu");
        allSubmenus.forEach(submenu => {
            const itemCount = submenu.querySelectorAll(".submenu-item").length;
            submenu.setAttribute("data-count", itemCount);
            // console.log(`Submenu has ${itemCount} items - applied grid layout`);
        });

        // Submenu animations
        const hasSubmenuItems = document.querySelectorAll(".has-submenu");
        const submenuStates = [];

        function closeOtherSubmenus(currentItem) {
            submenuStates.forEach(state => {
                if (state.item !== currentItem && state.isOpen) {
                    state.animation.reverse();
                    state.item.classList.remove("open");
                    state.isOpen = false;
                }
            });
        }

        hasSubmenuItems.forEach(item => {
            const submenu = item.querySelector(".submenu");
            if (!submenu) return;

            const animation = gsap.timeline({ paused: true });
            animation.fromTo(
                submenu,
                {
                    height: 0,
                    opacity: 0,
                    y: -10,
                    pointerEvents: "none"
                },
                {
                    height: "auto",
                    opacity: 1,
                    y: 0,
                    duration: 0.55,
                    pointerEvents: "auto",
                    ease: "power2.out"
                }
            );

            submenuStates.push({
                item: item,
                animation: animation,
                isOpen: false
            });
        });

        // Event listeners for submenu interactions
        submenuStates.forEach(state => {
            const { item, animation } = state;

            // Desktop: hover to open
            item.addEventListener("mouseenter", () => {
                if (window.innerWidth > 768) {
                    closeOtherSubmenus(item);
                    animation.play();
                    item.classList.add("open");
                    state.isOpen = true;
                }
            });

            item.addEventListener("mouseleave", () => {
                if (window.innerWidth > 768) {
                    animation.reverse();
                    item.classList.remove("open");
                    state.isOpen = false;
                }
            });

            // Mobile: click to toggle
            item.addEventListener("click", event => {
                if (window.innerWidth <= 768) {
                    event.stopPropagation();
                    closeOtherSubmenus(item);

                    if (state.isOpen) {
                        animation.reverse();
                        item.classList.remove("open");
                        state.isOpen = false;
                    } else {
                        animation.play();
                        item.classList.add("open");
                        state.isOpen = true;
                    }
                }
            });
        });

        // Prevent submenu from closing when hovering over it
        document.querySelectorAll(".submenu").forEach(submenu => {
            submenu.addEventListener("mouseenter", event => {
                event.stopPropagation();
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMenu);
    } else {
        initMenu();
    }
}();