 /* =============================================
           TIMELINE ABOUT COMPONENT - JavaScript
           ============================================= */
        function initTimelineAbout() {
            gsap.registerPlugin(ScrollTrigger);

            const container = document.querySelector('.timelineAbout-container');
            const progressLine = document.getElementById('timelineAboutProgressLine');
            const sections = Array.from(document.querySelectorAll('.timelineAbout-section'));

            if (!container || !progressLine) {
                console.warn('Timeline About: Required elements not found');
                return;
            }

            // =============================================
            // 1. SYNCED PROGRESS LINE
            // =============================================
            // Using scrub: true (1:1 with scroll) for absolute synchronization
            const triggerPoint = "top 50%"; 
            const endTriggerPoint = "bottom 50%";

            gsap.to(progressLine, {
                height: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: container,
                    start: triggerPoint, 
                    end: endTriggerPoint,
                    scrub: true 
                }
            });

            // =============================================
            // 2. POSITIONING & RESPONSIVENESS
            // =============================================
            function positionProgressLine() {
                const firstSection = document.querySelector('.timelineAbout-section');
                if (!firstSection) return;
                
                const lineColumn = firstSection.querySelector('.timelineAbout-line-column');
                if (!lineColumn) return;

                const containerRect = container.getBoundingClientRect();
                const colRect = lineColumn.getBoundingClientRect();
                
                const centerX = colRect.left + colRect.width / 2;
                const leftInside = Math.round(centerX - containerRect.left);

                progressLine.style.left = leftInside + 'px';
                
                const staticTrack = document.getElementById('timelineAboutStaticTrack');
                if (staticTrack) {
                    staticTrack.style.left = leftInside + 'px';
                }

                document.querySelectorAll('.timelineAbout-year-container').forEach((yc) => {
                    const dot = yc.querySelector('.timelineAbout-year-dot');
                    if (!dot) return;

                    const ycRect = yc.getBoundingClientRect();
                    const dotRect = dot.getBoundingClientRect();
                    const targetPageX = containerRect.left + leftInside;

                    if (window.innerWidth <= 768) {
                        yc.style.transform = '';
                        const leftWithin = Math.round(targetPageX - ycRect.left - (dotRect.width / 2));
                        dot.style.left = leftWithin + 'px';
                        dot.style.right = 'auto';
                    } else {
                        dot.style.left = '';
                        dot.style.right = '';
                        const dotCenterRel = (dotRect.left - containerRect.left) + dotRect.width / 2;
                        const shift = leftInside - Math.round(dotCenterRel);
                        yc.style.transform = `translateX(${shift}px)`;
                    }
                });
            }

            function getDotOffset(section) {
                const dot = section.querySelector('.timelineAbout-year-dot');
                if (!dot) return 0;
                const secRect = section.getBoundingClientRect();
                const dotRect = dot.getBoundingClientRect();
                return Math.round(dotRect.top - secRect.top + (dotRect.height / 2));
            }

            positionProgressLine();
            ScrollTrigger.addEventListener('refresh', positionProgressLine);

            // =============================================
            // 3. SYNCED ACTIVE STATES
            // =============================================
            let activeTriggers = [];

            function createActiveTriggers() {
                activeTriggers.forEach(t => t.kill());
                activeTriggers = [];

                sections.forEach((section) => {
                    const yearContainer = section.querySelector('.timelineAbout-year-container');
                    const offset = getDotOffset(section);
                    
                    const trig = ScrollTrigger.create({
                        trigger: section, 
                        start: `top+=${offset}px 50%`, 
                        end: "bottom 50%", 
                        toggleClass: { targets: yearContainer, className: "is-active" },
                        // Ensuring immediate response
                        fastScrollEnd: true
                    });
                    
                    activeTriggers.push(trig);
                });
            }

            createActiveTriggers();

            // =============================================
            // 4. PINNING (DESKTOP ONLY)
            // =============================================
            let pinTriggers = [];

            function createPins() {
                if (window.innerWidth <= 768) return;
                
                sections.forEach((section) => {
                    const yearContainer = section.querySelector('.timelineAbout-year-container');
                    const offset = getDotOffset(section);

                    const trig = ScrollTrigger.create({
                        trigger: section,
                        start: `top+=${offset}px 50%`,
                        end: "bottom 50%",
                        pin: yearContainer,
                        pinSpacing: false,
                        scrub: true, // Sync pinning movement to scroll speed exactly
                        anticipatePin: 1
                    });
                    
                    pinTriggers.push(trig);
                });
            }

            function killPins() {
                pinTriggers.forEach(t => t.kill());
                pinTriggers = [];
            }

            createPins();

            // =============================================
            // 5. CONTENT FADE-IN ANIMATIONS
            // =============================================
            sections.forEach((section) => {
                const content = section.querySelector('.timelineAbout-content');
                if (content) {
                    // Set initial state first
                    gsap.set(content, { opacity: 0, y: 30 });
                    
                    gsap.to(content, {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: section,
                            start: "top 75%",
                            end: "top 25%",
                            toggleActions: 'play none none none'
                        }
                    });
                }
            });

            // =============================================
            // RESIZE HANDLER
            // =============================================
            window.addEventListener('resize', () => {
                positionProgressLine();
                killPins();
                if (window.innerWidth > 768) {
                    createPins();
                }
                createActiveTriggers();
                ScrollTrigger.refresh();
            });
        }

        // Initialize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTimelineAbout);
        } else {
            initTimelineAbout();
        }