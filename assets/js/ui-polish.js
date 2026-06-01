(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    if (reduceMotion || !("IntersectionObserver" in window)) {
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
        const updateHeader = () => {
            header.classList.toggle("is-scrolled", window.scrollY > 12);
        };
        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });
    }

    const logoPanel = document.querySelector("#home .hero-logo-showcase");
    const heroModel = logoPanel?.querySelector(".himma-hero-model");
    if (logoPanel && heroModel) {
        heroModel.addEventListener("error", () => {
            logoPanel.classList.add("model-failed");
        }, { once: true });

        heroModel.addEventListener("load", () => {
            logoPanel.classList.add("model-ready");
            const materials = heroModel.model?.materials || [];
            materials.forEach((material) => {
                const name = material.name || "";
                const color = name.includes("green")
                    ? [0, 0.48, 0.22, 1]
                    : name.includes("red")
                        ? [0.82, 0.04, 0.1, 1]
                        : [0.02, 0.025, 0.022, 1];
                material.setDoubleSided?.(true);
                material.pbrMetallicRoughness?.setBaseColorFactor?.(color);
                material.pbrMetallicRoughness?.setMetallicFactor?.(0.02);
                material.pbrMetallicRoughness?.setRoughnessFactor?.(0.38);
            });
        }, { once: true });

        if (!reduceMotion) {
            logoPanel.addEventListener("pointermove", (event) => {
                const rect = logoPanel.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                logoPanel.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
                logoPanel.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
            }, { passive: true });

            logoPanel.addEventListener("pointerleave", () => {
                logoPanel.style.setProperty("--tilt-x", "0deg");
                logoPanel.style.setProperty("--tilt-y", "0deg");
            });
        }
    }
})();
