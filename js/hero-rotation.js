
/* ============================================================
   ALLSTAR GALAXY V132 — ROTATING HERO SYSTEM
   - Loads data/hero-rotation.json
   - Automatic crossfade every seven seconds
   - Touch swipe and keyboard support
   - Pauses on hover, focus, touch, or hidden browser tab
   - Honors reduced-motion preferences
   - Keeps the original hero as a permanent fallback
   ============================================================ */
(() => {
    "use strict";

    const DEFAULT_INTERVAL = 7000;
    const DEFAULT_TRANSITION = 1400;
    const CONFIG_URL = "data/hero-rotation.json?v=149";

    const pageKey = () => {
        const body = document.body;
        if (body.classList.contains("page-home")) return "home";
        if (body.classList.contains("page-team")) return "team";
        if (body.classList.contains("page-schedule")) return "schedule";
        if (body.classList.contains("page-media")) return "media";
        if (body.classList.contains("page-news")) return "news";
        if (body.classList.contains("page-live")) return "livestream";
        if (body.classList.contains("page-follow")) return "follow";
        if (body.classList.contains("page-about")) return "about";
        if (body.classList.contains("page-not-found")) return "404";
        if (body.classList.contains("page-season-archive")) return "season-archive";
        return "";
    };

    const fallbackConfig = {
        home: { selector: ".hero-image.hero-home", images: ["images/heroes/pages/hero-home.png"] },
        team: { selector: ".hero-image.hero-team", images: ["images/heroes/pages/hero-team.png"] },
        schedule: { selector: ".hero-image.hero-schedule", images: ["images/heroes/pages/hero-schedule.png"] },
        media: { selector: ".hero-image.hero-media", images: ["images/heroes/pages/hero-media.png"] },
        news: { selector: ".hero-image.hero-news", images: ["images/heroes/pages/hero-news.png"] },
        livestream: { selector: ".hero-image.hero-live", images: ["images/heroes/pages/hero-live.png"] },
        follow: { selector: ".hero-image.hero-follow", images: ["images/heroes/pages/hero-follow.png"] },
        about: { selector: ".special-page-hero.about-page-hero", images: ["images/heroes/pages/about-hero.png"] },
        "404": { selector: ".special-page-hero.not-found-page-hero", images: ["images/heroes/pages/404-hero.png"] },
        "season-archive": { selector: ".season-archive-hero", images: ["images/heroes/seasons/summer-2026-season-hero.png"] }
    };

    async function loadConfig() {
        try {
            if(new URLSearchParams(location.search).get("adminPreview")==="1"){
  try{const draft=sessionStorage.getItem("asgPreviewHeroRotation");if(draft)return JSON.parse(draft)}catch(e){}
}
const response = await fetch(CONFIG_URL, { cache: "no-store" });
            if (!response.ok) throw new Error(`Hero config ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn("Using fallback hero configuration.", error);
            return { interval: DEFAULT_INTERVAL, transition: DEFAULT_TRANSITION, pages: fallbackConfig };
        }
    }

    function preload(src) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve({ src, ok: true });
            image.onerror = () => resolve({ src, ok: false });
            image.src = src;
        });
    }

    function buildDots(container, total, goTo) {
        const dots = document.createElement("div");
        dots.className = "hero-rotation-dots";
        dots.setAttribute("role", "tablist");
        dots.setAttribute("aria-label", "Hero image navigation");

        const buttons = Array.from({ length: total }, (_, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "hero-rotation-dot";
            button.setAttribute("aria-label", `Show hero image ${index + 1}`);
            button.setAttribute("role", "tab");
            button.addEventListener("click", () => goTo(index, true));
            dots.appendChild(button);
            return button;
        });

        container.appendChild(dots);
        return buttons;
    }

    function initializeRotator(container, images, settings) {
        if (!container || !images.length) return;

        container.classList.add("hero-rotator");
        container.style.setProperty("--hero-transition", `${settings.transition}ms`);
        container.style.setProperty("--hero-duration", `${settings.interval}ms`);
        container.dataset.heroEffect = settings.effect || "fade";
        container.dataset.heroTransitionEffect = settings.transitionEffect || "glow-fade";
        container.dataset.heroGlowIntensity = settings.glowIntensity || "medium";
        const pageAccent = getComputedStyle(document.body).getPropertyValue("--page-accent").trim()
            || getComputedStyle(container).getPropertyValue("--page-accent").trim()
            || "#ffd700";
        const selectedGlow = settings.glowColor || "auto";
        const glowColor = selectedGlow === "auto"
            ? pageAccent
            : selectedGlow === "custom"
                ? (settings.customGlowColor || pageAccent)
                : selectedGlow;
        container.style.setProperty("--hero-glow-color", glowColor);

        const originalImage = container.querySelector(":scope > img");
        if (originalImage) originalImage.classList.add("hero-original-fallback");

        const stage = document.createElement("div");
        stage.className = "hero-rotation-stage";
        stage.setAttribute("aria-hidden", "true");

        const layers = [0, 1].map((number) => {
            const layer = document.createElement("div");
            layer.className = `hero-rotation-layer hero-rotation-layer-${number + 1}`;
            stage.appendChild(layer);
            return layer;
        });

        container.appendChild(stage);

        let currentIndex = 0;
        let activeLayer = 0;
        let timer = 0;
        let paused = false;
        let touchStartX = 0;
        let touchStartY = 0;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const setLayerImage = (layer, src) => {
            layer.style.backgroundImage =
                `linear-gradient(to bottom, rgba(5,0,15,.035), rgba(5,0,15,.18)), url("${src}")`;
        };

        const updateDots = () => {
            dotButtons.forEach((dot, index) => {
                const active = index === currentIndex;
                dot.classList.toggle("is-active", active);
                dot.setAttribute("aria-selected", String(active));
                dot.tabIndex = active ? 0 : -1;
            });
        };

        const show = (index, userInitiated = false) => {
            if (!images.length) return;
            const normalized = (index + images.length) % images.length;
            if (normalized === currentIndex && container.classList.contains("hero-rotation-ready")) return;

            const nextLayer = activeLayer === 0 ? 1 : 0;

            // Restart the transition-energy animation on every image change.
            container.classList.remove("hero-is-transitioning");
            void container.offsetWidth;
            container.classList.add("hero-is-transitioning");
            window.setTimeout(
                () => container.classList.remove("hero-is-transitioning"),
                Math.max(500, settings.transition + 350)
            );

            setLayerImage(layers[nextLayer], images[normalized]);
            layers[nextLayer].classList.add("is-active");
            layers[activeLayer].classList.remove("is-active");

            currentIndex = normalized;
            activeLayer = nextLayer;
            updateDots();

            if (userInitiated) restart();
        };

        const next = () => show(currentIndex + 1);
        const previous = () => show(currentIndex - 1, true);

        const schedule = () => {
            clearTimeout(timer);
            if (paused || reducedMotion || images.length < 2 || settings.enabled === false) return;
            timer = window.setTimeout(() => {
                next();
                schedule();
            }, settings.interval);
        };

        const restart = () => {
            clearTimeout(timer);
            schedule();
        };

        const setPaused = (value) => {
            paused = value;
            container.classList.toggle("is-paused", paused);
            if (paused) clearTimeout(timer);
            else schedule();
        };

        const dotButtons = buildDots(container, images.length, show);

        if (settings.enabled === false || images.length < 2) {
            container.classList.add("hero-rotation-static");
        }

        container.tabIndex = container.hasAttribute("tabindex") ? container.tabIndex : 0;
        container.setAttribute("aria-roledescription", "rotating hero image");
        container.setAttribute("aria-label", "Page hero image slideshow");

        container.addEventListener("mouseenter", () => setPaused(true));
        container.addEventListener("mouseleave", () => setPaused(false));
        container.addEventListener("focusin", () => setPaused(true));
        container.addEventListener("focusout", (event) => {
            if (!container.contains(event.relatedTarget)) setPaused(false);
        });

        container.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                previous();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                show(currentIndex + 1, true);
            }
        });

        container.addEventListener("touchstart", (event) => {
            const touch = event.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            setPaused(true);
        }, { passive: true });

        container.addEventListener("touchend", (event) => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < 0) show(currentIndex + 1, true);
                else previous();
            }
            window.setTimeout(() => setPaused(false), 900);
        }, { passive: true });

        document.addEventListener("visibilitychange", () => {
            setPaused(document.hidden);
        });

        setLayerImage(layers[0], images[0]);
        layers[0].classList.add("is-active");
        container.classList.add("hero-rotation-ready");
        updateDots();
        schedule();
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const key = pageKey();
        if (!key) return;

        const config = await loadConfig();
        const entry = config.pages?.[key] || fallbackConfig[key];
        if (!entry) return;

        const requested = Array.isArray(entry.images) ? entry.images.filter(Boolean) : [];
        if (!requested.length) return;

        const results = await Promise.all(requested.map(preload));
        const validImages = results.filter((item) => item.ok).map((item) => item.src);
        if (!validImages.length) return;

        const container = document.querySelector(entry.selector);
        initializeRotator(container, validImages, {
            interval: Math.max(3000, Number(entry.interval || config.interval || DEFAULT_INTERVAL)),
            transition: Math.max(300, Number(entry.transition || config.transition || DEFAULT_TRANSITION)),
            effect: entry.effect || "fade",
            transitionEffect: entry.transitionEffect || "glow-fade",
            glowIntensity: entry.glowIntensity || "medium",
            enabled: entry.enabled !== false
        });
    });
})();
