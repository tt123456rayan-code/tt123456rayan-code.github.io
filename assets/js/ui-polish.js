(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lightweightMotion = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const revealSelectors = [
        ".section-title",
        ".section-lead",
        "#home .hero-copy",
        "#home .logo-panel",
        "#home .hero-actions",
        ".hero-stats",
        ".impact-card",
        ".royal-card",
        ".article-card",
        ".committee-directory-card",
        ".committee-article-panel",
        "#structure .committee-panel",
        "#structure .profile-card",
        ".news-card",
        ".initiative-card",
        ".partner-card",
        ".contact-card",
        ".form-card",
        ".auth-card",
        ".profile-summary-card",
        ".site-footer"
    ];
    const revealItems = Array.from(document.querySelectorAll(revealSelectors.join(",")));
    revealItems.forEach((item, index) => {
        item.classList.add("motion-reveal");
        item.style.setProperty("--reveal-delay", `${Math.min((index % 6) * 45, 225)}ms`);
    });

    if (reduceMotion || lightweightMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

        revealItems.forEach((item) => observer.observe(item));
    }

    const header = document.querySelector(".site-header");
    if (header) {
        let ticking = false;
        const updateHeader = () => {
            header.classList.toggle("is-scrolled", window.scrollY > 12);
            ticking = false;
        };
        updateHeader();
        window.addEventListener("scroll", () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(updateHeader);
            }
        }, { passive: true });
    }

})();
