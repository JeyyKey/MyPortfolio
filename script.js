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

    let lastFocus = null;
    let images = [];
    let index = 0;

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

        const title = el.getAttribute('data-title') || 'Project';
        const subtitle = el.getAttribute('data-subtitle') || 'Project';
        const meta = el.getAttribute('data-meta') || '';
        const imgs = (el.getAttribute('data-images') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        if (titleEl) titleEl.textContent = title;
        if (tagEl) tagEl.textContent = subtitle;
        if (metaEl) metaEl.textContent = meta;

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
})();
