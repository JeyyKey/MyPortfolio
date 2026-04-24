(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile navigation
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('#site-nav');
    const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

    function setNavOpen(isOpen) {
        if (!toggle || !nav) return;
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        document.documentElement.classList.toggle('nav-open', isOpen);
    }

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            setNavOpen(!isOpen);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setNavOpen(false);
        });

        navLinks.forEach((a) => {
            a.addEventListener('click', () => setNavOpen(false));
        });
    }

    // Smooth scrolling for in-page links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            if (prefersReducedMotion) {
                target.scrollIntoView();
                return;
            }

            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Reveal-on-scroll animations (lightweight)
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const reveal = document.querySelectorAll('.card, .section-header, .hero-content');
        reveal.forEach((el) => el.classList.add('reveal'));

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('reveal-in');
                    io.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
        );

        reveal.forEach((el) => io.observe(el));
    }

    // Scroll spy: highlight active section in navbar
    if ('IntersectionObserver' in window) {
        const sectionIds = ['home', 'about', 'services', 'portfolio', 'skills', 'contact'];
        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter(Boolean);
        const linkById = new Map(
            sectionIds.map((id) => [id, document.querySelector(`.site-nav a[href="#${id}"]`)])
        );

        function setActive(id) {
            linkById.forEach((link, key) => {
                if (!link) return;
                link.classList.toggle('is-active', key === id);
            });
        }

        const spy = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
                if (!visible) return;
                setActive(visible.target.id);
            },
            { rootMargin: '-30% 0px -60% 0px', threshold: [0.05, 0.1, 0.2, 0.35] }
        );

        sections.forEach((s) => spy.observe(s));
        setActive(sections[0]?.id || 'home');
    }

    // Project modal + carousel
    const modal = document.getElementById('project-modal');
    const modalPanel = modal?.querySelector('.modal-panel');
    const modalCloseEls = modal?.querySelectorAll('[data-modal-close]');
    const imgEl = modal?.querySelector('.carousel-img');
    const dotsEl = modal?.querySelector('.carousel-dots');
    const prevBtn = modal?.querySelector('[data-carousel="prev"]');
    const nextBtn = modal?.querySelector('[data-carousel="next"]');
    const titleEl = document.getElementById('project-modal-title');
    const tagEl = document.getElementById('project-modal-tag');
    const metaEl = document.getElementById('project-modal-meta');
    const descEl = document.getElementById('project-modal-desc');
    const techEl = document.getElementById('project-modal-tech');
    const liveLinkEl = modal?.querySelector('.modal-links a:nth-child(1)');
    const repoLinkEl = modal?.querySelector('.modal-links a:nth-child(2)');

    let lastFocus = null;
    let images = [];
    let index = 0;
    const projectDetails = {
        enrollment: {
            description: 'Software engineering project for Saint Isidore Children School focused on digitizing the enrollment workflow.',
            tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
            live: '',
            repo: ''
        },
        hrim: {
            description: 'Capstone project for Fuji Philippines Corporation for managing employee records and HR-related information.',
            tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
            live: '',
            repo: ''
        },
        freelance: {
            description: 'A freelance web build with light/dark themes and responsive layouts for web and mobile.',
            tech: ['HTML', 'CSS', 'JavaScript'],
            client: 'Wednesdays Agency',
            live: 'https://wednesdayvirtualhub.com/',
            repo: ''
        },
        branding: {
            description: 'Logo and branding explorations for client identity systems and marketing assets.',
            tech: ['Canva', 'Adobe Photoshop'],
            live: '',
            repo: ''
        },
        wireframes: {
            description: 'Wireframe studies focused on information structure, flow, and responsive user experience.',
            tech: ['Figma', 'Canva', 'UX Planning'],
            live: '',
            repo: ''
        }
    };

    function setProjectLink(linkEl, url) {
        if (!linkEl) return;
        if (url) {
            linkEl.href = url;
            linkEl.removeAttribute('aria-disabled');
            linkEl.removeAttribute('tabindex');
        } else {
            linkEl.href = '#';
            linkEl.setAttribute('aria-disabled', 'true');
            linkEl.setAttribute('tabindex', '-1');
        }
    }

    function setModalOpen(isOpen) {
        if (!modal) return;
        modal.classList.toggle('is-open', isOpen);
        modal.setAttribute('aria-hidden', String(!isOpen));
        document.documentElement.classList.toggle('modal-open', isOpen);
        if (isOpen) {
            // Focus first interactive element for accessibility
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn?.focus();
        } else {
            lastFocus?.focus?.();
            lastFocus = null;
        }
    }

    function renderCarousel() {
        if (!imgEl || !dotsEl) return;
        const src = images[index] || '';
        imgEl.src = src;
        imgEl.alt = titleEl?.textContent ? `${titleEl.textContent} image ${index + 1}` : `Project image ${index + 1}`;

        dotsEl.innerHTML = '';
        images.forEach((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `carousel-dot${i === index ? ' is-active' : ''}`;
            b.setAttribute('aria-label', `Show image ${i + 1}`);
            b.addEventListener('click', () => {
                index = i;
                renderCarousel();
            });
            dotsEl.appendChild(b);
        });
    }

    function openProjectFrom(el) {
        if (!modal || !el) return;
        lastFocus = document.activeElement;

        const projectKey = el.getAttribute('data-project') || '';
        const title = el.getAttribute('data-title') || 'Project';
        const subtitle = el.getAttribute('data-subtitle') || 'Project';
        const meta = el.getAttribute('data-meta') || '';
        const details = projectDetails[projectKey] || {};
        const description = el.getAttribute('data-desc') || details.description || 'Project details coming soon.';
        const tech = (el.getAttribute('data-tech') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const liveUrl = el.getAttribute('data-live') || details.live || '';
        const repoUrl = el.getAttribute('data-repo') || details.repo || '';
        const imgs = (el.getAttribute('data-images') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        if (titleEl) titleEl.textContent = title;
        if (tagEl) tagEl.textContent = subtitle;
        if (metaEl) metaEl.textContent = meta;
        if (descEl) descEl.textContent = description;
        if (techEl) {
            const techItems = tech.length ? tech : (details.tech || ['HTML', 'CSS', 'JavaScript']);
            techEl.innerHTML = '';
            techItems.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item;
                techEl.appendChild(li);
            });
        }
        setProjectLink(liveLinkEl, liveUrl);
        setProjectLink(repoLinkEl, repoUrl);

        images = imgs.length ? imgs : ['avatar.png'];
        index = 0;
        renderCarousel();

        setModalOpen(true);
    }

    document.querySelectorAll('.project-card').forEach((card) => {
        card.addEventListener('click', () => openProjectFrom(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProjectFrom(card);
            }
        });
    });

    modalCloseEls?.forEach((el) => el.addEventListener('click', () => setModalOpen(false)));

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        // Close modal first, otherwise close nav (already handled above)
        if (modal?.classList.contains('is-open')) setModalOpen(false);
    });

    prevBtn?.addEventListener('click', () => {
        if (!images.length) return;
        index = (index - 1 + images.length) % images.length;
        renderCarousel();
    });
    nextBtn?.addEventListener('click', () => {
        if (!images.length) return;
        index = (index + 1) % images.length;
        renderCarousel();
    });

    modal?.querySelectorAll('.modal-links a').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('aria-disabled') === 'true') {
                e.preventDefault();
            }
        });
    });

    // Basic focus trap for modal
    modalPanel?.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusables = modalPanel.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // Visual effects inspired by the reference project
    if (!prefersReducedMotion) {
        document.querySelectorAll('.btn, .card-hover, .nav-links a').forEach((el) => {
            el.addEventListener('mouseenter', () => {
                el.style.filter = 'brightness(1.12)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.filter = 'brightness(1)';
            });
        });

        // Cursor glow (desktop only)
        if (window.matchMedia('(pointer: fine)').matches) {
            const cursorGlow = document.createElement('div');
            cursorGlow.className = 'cursor-glow';
            document.body.appendChild(cursorGlow);

            document.addEventListener('mousemove', (e) => {
                cursorGlow.style.left = `${e.clientX}px`;
                cursorGlow.style.top = `${e.clientY}px`;
            });
        }

        // Subtle particle background
        const canvas = document.createElement('canvas');
        canvas.className = 'fx-particles';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (ctx) {
            let particles = [];

            function resizeParticlesCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            function createParticles() {
                particles = Array.from({ length: 45 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.3,
                    speedY: Math.random() * 0.45 + 0.15
                }));
            }

            function drawParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach((p) => {
                    ctx.fillStyle = 'rgba(255, 45, 45, 0.35)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();

                    p.y += p.speedY;
                    if (p.y > canvas.height) p.y = 0;
                });
                requestAnimationFrame(drawParticles);
            }

            window.addEventListener('resize', resizeParticlesCanvas);
            resizeParticlesCanvas();
            createParticles();
            drawParticles();
        }
    }

    // Gentle page fade-in transition
    document.body.classList.add('is-preload');
    window.addEventListener('load', () => {
        document.body.classList.remove('is-preload');
    });
})();
